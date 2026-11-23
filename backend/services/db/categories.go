package db

import (
	"context"
	"database/sql"
	"webserver/models"
	"webserver/services"

	"github.com/volatiletech/sqlboiler/v4/boil"
	"github.com/volatiletech/sqlboiler/v4/queries/qm"
)

type categories struct {
	db *sql.DB
}

// NewCategories creates the category service.
func NewCategories(db *sql.DB) services.Categories {
	return &categories{db}
}

func (c *categories) Find(ctx context.Context, cid int64) (*models.Category, error) {
	return models.FindCategory(ctx, c.db, cid)
}

func (c *categories) FindMany(ctx context.Context, creatorID int64) (models.CategorySlice, error) {
	return models.Categories(
		models.CategoryWhere.CreatorID.EQ(creatorID),
		qm.OrderBy(models.CategoryColumns.Name),
	).All(ctx, c.db)
}

func (c *categories) ExistsName(ctx context.Context, creatorID int64, name string) (bool, error) {
	return models.Categories(
		qm.Where("creator_id = ? AND lower(name) = lower(?)", creatorID, name),
	).Exists(ctx, c.db)
}

func (c *categories) Create(ctx context.Context, category *models.Category) error {
	return category.Insert(ctx, c.db, boil.Infer())
}

func (c *categories) Update(ctx context.Context, category *models.Category, columns boil.Columns) error {
	_, err := category.Update(ctx, c.db, columns)
	return err
}

func (c *categories) Delete(ctx context.Context, category *models.Category) error {
	_, err := category.Delete(ctx, c.db)
	return err
}
