package transcoder

import (
	"encoding/json"
	"os/exec"
	"strconv"
	"strings"

	"github.com/pkg/errors"
)

type videoProbe struct {
	Streams []struct {
		CodecType   string `json:"codec_type"`
		CodecName   string `json:"codec_name"`
		Width       int    `json:"width"`
		Height      int    `json:"height"`
		Disposition struct {
			AttachedPic int `json:"attached_pic"`
		} `json:"disposition"`
	} `json:"streams"`
	Format struct {
		FormatName string `json:"format_name"`
		Duration   string `json:"duration"`
	} `json:"format"`
}

var imageFormats = map[string]bool{
	"image2":        true,
	"ico":           true,
	"ico_pipe":      true,
	"png_pipe":      true,
	"jpeg_pipe":     true,
	"gif":           true,
	"gif_pipe":      true,
	"webp_pipe":     true,
	"bmp_pipe":      true,
	"tiff_pipe":     true,
	"pgm_pipe":      true,
	"ppm_pipe":      true,
	"sgi_pipe":      true,
	"targa_pipe":    true,
	"exr_pipe":      true,
	"dpx_pipe":      true,
	"jpeg2000_pipe": true,
	"jpegxl_pipe":   true,
	"qoi_pipe":      true,
	"avif":          true,
	"heic":          true,
	"heif":          true,
	"svg_pipe":      true,
}

// ValidateVideo checks the actual content of a file and rejects images, audio,
// documents, and other non-video payloads. It deliberately does not trust the
// uploaded filename or MIME type.
func ValidateVideo(file string) error {
	out, err := exec.Command(
		"ffprobe",
		"-v", "error",
		"-show_entries", "format=format_name,duration:stream=codec_type,codec_name,width,height:stream_disposition=attached_pic",
		"-of", "json",
		file,
	).CombinedOutput()

	if err != nil {
		return errors.Wrapf(err, "ffprobe failed: %s", out)
	}

	var probe videoProbe

	if err := json.Unmarshal(out, &probe); err != nil {
		return errors.Wrap(err, "failed to parse video probe")
	}

	for _, format := range strings.Split(probe.Format.FormatName, ",") {
		if imageFormats[strings.TrimSpace(format)] {
			return errors.New("file is an image, not a video")
		}
	}

	for _, stream := range probe.Streams {
		if stream.CodecType == "video" && stream.Disposition.AttachedPic == 0 && stream.Width > 0 && stream.Height > 0 {
			if probe.Format.Duration != "" {
				duration, err := strconv.ParseFloat(probe.Format.Duration, 64)
				if err == nil && duration <= 0 {
					return errors.New("video has no duration")
				}
			}

			return nil
		}
	}

	return errors.New("no video stream found")
}
