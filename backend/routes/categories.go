package routes

import (
	"database/sql"
	"net/http"
	"webserver/models"
	"webserver/modelsx"

	"github.com/pkg/errors"
	"github.com/volatiletech/sqlboiler/v4/boil"
)

// GetCategories returns the current user's folders.
//
// GET /categories
func (r *Routes) GetCategories(user *models.User, req *http.Request) (int, []byte, error) {
	if user == nil {
		return http.StatusUnauthorized, nil, nil
	}

	categories, err := r.Categories.FindMany(req.Context(), user.ID)

	if err != nil {
		return http.StatusInternalServerError, nil, errors.Wrap(err, "failed to find categories")
	}

	return modelsx.CategoryFromModelBatch(categories...).Marshal()
}

// GetUserCategories returns a user's public folders.
//
// GET /users/{user id}/categories
func (r *Routes) GetUserCategories(user *models.User, req *http.Request) (int, []byte, error) {
	vars := vars(req)

	if user == nil || vars.UID != user.ID {
		return http.StatusNotFound, nil, nil
	}

	categories, err := r.Categories.FindMany(req.Context(), vars.UID)

	if err != nil {
		return http.StatusInternalServerError, nil, errors.Wrap(err, "failed to find categories")
	}

	return modelsx.CategoryFromModelBatch(categories...).Marshal()
}

// CreateCategory creates a folder for the current user.
//
// POST /categories
func (r *Routes) CreateCategory(user *models.User, req *http.Request) (int, []byte, error) {
	if user == nil {
		return http.StatusUnauthorized, nil, nil
	}

	category, err := modelsx.ParseCategory(req.Body)

	if err != nil {
		return http.StatusBadRequest, []byte(err.Error()), nil
	}

	exists, err := r.Categories.ExistsName(req.Context(), user.ID, category.Name)

	if err != nil {
		return http.StatusInternalServerError, nil, errors.Wrap(err, "failed to check category name")
	}

	if exists {
		return http.StatusConflict, []byte("A folder with that name already exists"), nil
	}

	model := category.ToModel()
	model.CreatorID = user.ID

	if err := r.Categories.Create(req.Context(), model); err != nil {
		return http.StatusInternalServerError, nil, errors.Wrap(err, "failed to create category")
	}

	return modelsx.CategoryFromModel(model).Marshal()
}

// UpdateCategory renames one of the current user's folders.
//
// PATCH /categories/{category id}
func (r *Routes) UpdateCategory(user *models.User, req *http.Request) (int, []byte, error) {
	if user == nil {
		return http.StatusUnauthorized, nil, nil
	}

	vars := vars(req)

	category, err := r.Categories.Find(req.Context(), vars.CatID)

	if err == sql.ErrNoRows {
		return http.StatusNotFound, nil, nil
	} else if err != nil {
		return http.StatusInternalServerError, nil, errors.Wrap(err, "failed to find category")
	}

	if category.CreatorID != user.ID {
		return http.StatusForbidden, nil, nil
	}

	update, err := modelsx.ParseCategory(req.Body)

	if err != nil {
		return http.StatusBadRequest, []byte(err.Error()), nil
	}

	if update.Name != category.Name {
		exists, err := r.Categories.ExistsName(req.Context(), user.ID, update.Name)

		if err != nil {
			return http.StatusInternalServerError, nil, errors.Wrap(err, "failed to check category name")
		}

		if exists {
			return http.StatusConflict, []byte("A folder with that name already exists"), nil
		}
	}

	category.Name = update.Name

	if err := r.Categories.Update(req.Context(), category, boil.Whitelist(models.CategoryColumns.Name)); err != nil {
		return http.StatusInternalServerError, nil, errors.Wrap(err, "failed to update category")
	}

	return modelsx.CategoryFromModel(category).Marshal()
}

// DeleteCategory deletes one of the current user's folders. Clips keep their
// place and become uncategorized.
//
// DELETE /categories/{category id}
func (r *Routes) DeleteCategory(user *models.User, req *http.Request) (int, []byte, error) {
	if user == nil {
		return http.StatusUnauthorized, nil, nil
	}

	vars := vars(req)

	category, err := r.Categories.Find(req.Context(), vars.CatID)

	if err == sql.ErrNoRows {
		return http.StatusNotFound, nil, nil
	} else if err != nil {
		return http.StatusInternalServerError, nil, errors.Wrap(err, "failed to find category")
	}

	if category.CreatorID != user.ID {
		return http.StatusForbidden, nil, nil
	}

	if err := r.Categories.Delete(req.Context(), category); err != nil {
		return http.StatusInternalServerError, nil, errors.Wrap(err, "failed to delete category")
	}

	return http.StatusNoContent, nil, nil
}
