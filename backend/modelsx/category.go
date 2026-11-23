package modelsx

import (
	"io"
	"net/http"
	"strings"
	"time"
	"webserver/models"

	"github.com/friendsofgo/errors"
)

// De/Serializer cases
var (
	CategorySerialize = MakeCodec("out")

	CategoryDeserialize = MakeCodec("in")

	CategoryValidate = makeValidator("validate")
)

// Category is a user-owned folder for clips.
type Category struct {
	ID        int64     `validate:"-"                  in:"-"      out:"id"`
	Name      string    `validate:"min=1,max=64"       in:"name"   out:"name"`
	CreatedAt time.Time `validate:"-"                  in:"-"      out:"created_at"`
}

// ToModel converts a modelsx.Category object to a model.Category object.
func (c *Category) ToModel() *models.Category {
	return &models.Category{
		ID:        c.ID,
		Name:      c.Name,
		CreatedAt: c.CreatedAt,
	}
}

// Marshal converts a Category into a sendable JSON byte array.
func (c *Category) Marshal() (int, []byte, error) {
	data, err := CategorySerialize.Marshal(c)
	code := http.StatusOK

	if err != nil {
		code = http.StatusInternalServerError
	}

	return code, data, err
}

// CategoryFromModel converts a models.Category into a modelsx.Category.
func CategoryFromModel(m *models.Category) *Category {
	if m == nil {
		return nil
	}

	return &Category{
		ID:        m.ID,
		Name:      m.Name,
		CreatedAt: m.CreatedAt,
	}
}

// CategoryArray is a helper type representing an array of Category objects.
type CategoryArray []*Category

// Marshal converts a CategoryArray into a sendable JSON byte array.
func (aa CategoryArray) Marshal() (int, []byte, error) {
	if aa == nil {
		return http.StatusOK, []byte("[]"), nil
	}

	data, err := CategorySerialize.Marshal(aa)
	code := http.StatusOK

	if err != nil {
		code = http.StatusInternalServerError
	}

	return code, data, err
}

// CategoryFromModelBatch converts multiple models.Category into a CategoryArray.
func CategoryFromModelBatch(model ...*models.Category) CategoryArray {
	var categories CategoryArray

	for _, m := range model {
		categories = append(categories, CategoryFromModel(m))
	}

	return categories
}

// ParseCategory parses a Category out of a client request.
func ParseCategory(req io.Reader) (*Category, error) {
	data, err := io.ReadAll(io.LimitReader(req, 2*1024))

	if err != nil {
		return nil, errors.Wrap(err, "failed to read request body")
	}

	category := &Category{}

	if err := CategoryDeserialize.Unmarshal(data, category); err != nil {
		return nil, errors.Wrap(err, "failed to unmarshal request body")
	}

	category.Name = strings.TrimSpace(category.Name)

	if err := CategoryValidate.Struct(category); err != nil {
		return nil, handleValidationError(err)
	}

	return category, nil
}
