package routes

import (
	"database/sql"
	"fmt"
	"net"
	"net/http"
	"strings"
	"sync"
	"webserver/modelsx"

	"github.com/alexedwards/argon2id"
	"github.com/friendsofgo/errors"
	"github.com/gorilla/sessions"
	"github.com/volatiletech/sqlboiler/v4/boil"

	log "github.com/sirupsen/logrus"
)

const SESSION_NAME = "webserver"

var cookieDomainWarning sync.Once

// session loads the session and drops a configured cookie domain that the
// request host does not belong to. Without this, copying a placeholder
// COOKIE_DOMAIN lets the browser reject the cookie, so login appears to work
// and then the next page treats the visitor as signed out.
func (r *Routes) session(req *http.Request) *sessions.Session {
	session, _ := r.store.Get(req, SESSION_NAME)
	r.applyCookieDomain(session, req)
	return session
}

func (r *Routes) applyCookieDomain(session *sessions.Session, req *http.Request) {
	domain := strings.TrimPrefix(strings.ToLower(r.cfg.Cookie.Domain), ".")

	if domain == "" {
		return
	}

	host := strings.ToLower(req.Host)

	if h, _, err := net.SplitHostPort(host); err == nil {
		host = h
	}

	if host == domain || strings.HasSuffix(host, "."+domain) {
		return
	}

	if session.Options.Domain != "" {
		cookieDomainWarning.Do(func() {
			log.WithFields(log.Fields{"cookie_domain": domain, "request_host": host}).
				Warnln("COOKIE_DOMAIN does not match this host; using a host-only session cookie")
		})
	}

	session.Options.Domain = ""
}

const SESSION_KEY_UID = "uid"
const SESSION_KEY_OAUTH_STATE = "oauth-state"
const SESSION_KEY_ID = "id"

func (r *Routes) AllowRegistration(resp http.ResponseWriter, req *http.Request) (int, []byte, error) {
	if !r.cfg.AllowRegistration {
		return http.StatusForbidden, nil, nil
	}

	return http.StatusOK, nil, nil
}

// SetupStatus reports whether the instance still needs its first account.
func (r *Routes) SetupStatus(resp http.ResponseWriter, req *http.Request) (int, []byte, error) {
	exists, err := r.Users.OwnerExists(req.Context())

	if err != nil {
		return http.StatusInternalServerError, nil, errors.Wrap(err, "Failed to check for an owner")
	}

	return http.StatusOK, []byte(fmt.Sprintf(`{"needs_setup":%t}`, !exists)), nil
}

// Setup creates the instance owner and signs them in. It is only available
// while no real account exists, and ignores ALLOW_REGISTRATION so a fresh
// instance can never lock itself out.
func (r *Routes) Setup(resp http.ResponseWriter, req *http.Request) (int, []byte, error) {
	ownerExists, err := r.Users.OwnerExists(req.Context())

	if err != nil {
		return http.StatusInternalServerError, nil, errors.Wrap(err, "Failed to check for an owner")
	} else if ownerExists {
		return http.StatusConflict, []byte("Setup is already complete"), nil
	}

	usr, err := modelsx.ParseUser(req, modelsx.UserValidateRegister)

	if err != nil {
		return http.StatusBadRequest, []byte(err.Error()), nil
	}

	exists, err := r.Users.ExistsUsername(req.Context(), usr.Username.String)

	if err != nil {
		return http.StatusInternalServerError, nil, errors.Wrap(err, "Failed to check if username exists")
	}

	if exists {
		return http.StatusConflict, []byte("Username already exists"), nil
	}

	hash, err := argon2id.CreateHash(usr.Password.String, argon2id.DefaultParams)

	if err != nil {
		return http.StatusInternalServerError, nil, errors.Wrap(err, "Failed to hash password")
	}

	usr.Password.String = hash

	model := usr.ToModel()

	created, err := r.Users.CreateFirstOwner(req.Context(), model, boil.Whitelist(usr.GetUpdateWhitelist()...))

	if err != nil {
		return http.StatusInternalServerError, nil, errors.Wrap(err, "Failed to create owner")
	} else if !created {
		return http.StatusConflict, []byte("Setup is already complete"), nil
	}

	session := r.session(req)

	session.Values[SESSION_KEY_ID] = model.ID
	if err := session.Save(req, resp); err != nil {
		return http.StatusInternalServerError, nil, errors.Wrap(err, "Failed to save session")
	}

	return modelsx.UserFromModel(model).Marshal()
}

func (r *Routes) Login(resp http.ResponseWriter, req *http.Request) (int, []byte, error) {
	session := r.session(req)

	json, err := modelsx.ParseUser(req, modelsx.UserValidateRegister)

	if err != nil {
		return http.StatusBadRequest, []byte(err.Error()), nil
	}

	user, err := r.Users.FindUsername(req.Context(), json.Username.String)

	if err == sql.ErrNoRows {
		return http.StatusUnauthorized, []byte("Invalid username/password combination"), nil
	} else if err != nil {
		return http.StatusInternalServerError, nil, errors.Wrap(err, "Failed to find user")
	}

	match, err := argon2id.ComparePasswordAndHash(json.Password.String, user.Password)

	if err != nil {
		return http.StatusInternalServerError, nil, errors.Wrap(err, "Failed to compare password")
	}

	if !match {
		return http.StatusUnauthorized, []byte("Invalid username/password combination"), nil
	}

	session.Values[SESSION_KEY_ID] = user.ID
	if err := session.Save(req, resp); err != nil {
		return http.StatusInternalServerError, nil, errors.Wrap(err, "Failed to save session")
	}

	return modelsx.UserFromModel(user).Marshal()
}

func (r *Routes) Logout(resp http.ResponseWriter, req *http.Request) (int, []byte, error) {
	session := r.session(req)

	session.Options.MaxAge = -1

	if err := session.Save(req, resp); err != nil {
		return http.StatusInternalServerError, nil, errors.Wrap(err, "Failed to save session")
	}

	resp.Header().Set("Clear-Site-Data", `"cookies"`)

	return http.StatusOK, nil, nil
}

func (r *Routes) Register(resp http.ResponseWriter, req *http.Request) (int, []byte, error) {
	if !r.cfg.AllowRegistration {
		return http.StatusForbidden, []byte("Registration is disabled"), nil
	}

	usr, err := modelsx.ParseUser(req, modelsx.UserValidateRegister)

	if err != nil {
		return http.StatusBadRequest, []byte(err.Error()), nil
	}

	exists, err := r.Users.ExistsUsername(req.Context(), usr.Username.String)

	if err != nil {
		return http.StatusInternalServerError, nil, errors.Wrap(err, "Failed to check if username exists")
	}

	if exists {
		return http.StatusConflict, []byte("Username already exists"), nil
	}

	hash, err := argon2id.CreateHash(usr.Password.String, argon2id.DefaultParams)

	if err != nil {
		return http.StatusInternalServerError, nil, errors.Wrap(err, "Failed to hash password")
	}

	usr.Password.String = hash

	model := usr.ToModel()

	if err := r.Users.Create(req.Context(), model, boil.Whitelist(usr.GetUpdateWhitelist()...)); err != nil {
		return http.StatusInternalServerError, nil, errors.Wrap(err, "Failed to create user")
	}

	session := r.session(req)

	session.Values[SESSION_KEY_ID] = model.ID
	if err := session.Save(req, resp); err != nil {
		return http.StatusInternalServerError, nil, errors.Wrap(err, "Failed to save session")
	}

	return modelsx.UserFromModel(model).Marshal()
}
