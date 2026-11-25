package db

import (
	"context"
	"database/sql"
	"webserver/models"
	"webserver/services"

	"github.com/volatiletech/sqlboiler/v4/boil"
	"github.com/volatiletech/sqlboiler/v4/queries/qm"
)

// systemUsername is the placeholder row created by the initial migration.
// It is not a real account and does not count as the instance owner.
const systemUsername = "Anonymous"

type users struct {
	db *sql.DB
}

// NewUsers Comment for linter
func NewUsers(db *sql.DB) services.Users {
	return &users{db}
}

func (u *users) Find(ctx context.Context, uid int64) (*models.User, error) {
	return models.FindUser(ctx, u.db, uid)
}

func (u *users) FindUsername(ctx context.Context, username string) (*models.User, error) {
	return models.Users(models.UserWhere.Username.EQ(username)).One(ctx, u.db)
}

func (u *users) FindMany(ctx context.Context, mods ...qm.QueryMod) (models.UserSlice, error) {
	return models.Users(mods...).All(ctx, u.db)
}

func (u *users) Exists(ctx context.Context, uid int64) (bool, error) {
	return models.UserExists(ctx, u.db, uid)
}

func (u *users) ExistsUsername(ctx context.Context, username string) (bool, error) {
	return models.Users(models.UserWhere.Username.EQ(username)).Exists(ctx, u.db)
}

// OwnerExists reports whether a real account exists. The migration's
// placeholder user does not count, so a fresh instance reports false.
func (u *users) OwnerExists(ctx context.Context) (bool, error) {
	return models.Users(models.UserWhere.Username.NEQ(systemUsername)).Exists(ctx, u.db)
}

// CreateFirstOwner creates the instance owner only if no real account exists.
// The advisory lock keeps two simultaneous setup requests from both winning.
func (u *users) CreateFirstOwner(ctx context.Context, user *models.User, columns boil.Columns) (bool, error) {
	tx, err := u.db.BeginTx(ctx, nil)

	if err != nil {
		return false, err
	}

	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, "SELECT pg_advisory_xact_lock(724501)"); err != nil {
		return false, err
	}

	exists, err := models.Users(models.UserWhere.Username.NEQ(systemUsername)).Exists(ctx, tx)

	if err != nil {
		return false, err
	} else if exists {
		return false, nil
	}

	if err := user.Insert(ctx, tx, columns); err != nil {
		return false, err
	}

	if err := tx.Commit(); err != nil {
		return false, err
	}

	return true, nil
}

func (u *users) SearchMany(ctx context.Context, query string) (models.UserSlice, error) {
	return models.Users(
		// TODO: Figure out a good way to not replicate the `f_concat_ws` composite index declaration everywhere
		qm.Select("*"),
		qm.Where("f_concat_ws(' ', username, email, firstname, lastname) ILIKE ?", "%"+query+"%"),
		qm.OrderBy("f_concat_ws(' ', username, email, firstname, lastname) <-> ?", "%"+query+"%"),
		qm.Limit(10),
	).All(ctx, u.db)
}

func (u *users) Update(ctx context.Context, user *models.User, columns boil.Columns) error {
	_, err := user.Update(ctx, u.db, columns)

	return err
}

func (u *users) Create(ctx context.Context, user *models.User, columns boil.Columns) error {
	return user.Insert(ctx, u.db, columns)
}
