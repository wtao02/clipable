package transcoder

import (
	"encoding/json"
	"fmt"
	"math"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"github.com/pkg/errors"
	"github.com/samber/lo"
)

// Resolution is a struct that contains the width and height of a video
type Quality struct {
	Width     int
	Height    int
	Bitrate   float32
	Framerate int
}

type VideoInfo struct {
	Streams []StreamInfo `json:"streams"`
	Format  FormatInfo   `json:"format"`
}

type FormatInfo struct {
	Duration string `json:"duration"`
}

type SideData struct {
	Rotation int `json:"rotation"`
}

type StreamInfo struct {
	Width        int        `json:"width"`
	Height       int        `json:"height"`
	Index        int        `json:"index"`
	CodecType    string     `json:"codec_type"`
	RFrameRate   string     `json:"r_frame_rate"`
	SideDataList []SideData `json:"side_data_list"`
}

func bitString(bitrate float32) string {
	return strconv.FormatFloat(float64(bitrate), 'f', 1, 64) + "M"
}

// parseFrameRate parses ffprobe's rational frame rate (e.g. "24000/1001")
// into a floating point value. Taking only the numerator would turn 23.976
// into 24000 and 59.94 into 60000, which breaks preset selection, GOP sizing
// and progress reporting.
func parseFrameRate(raw string) (float64, error) {
	parts := strings.SplitN(strings.TrimSpace(raw), "/", 2)

	num, err := strconv.ParseFloat(parts[0], 64)
	if err != nil {
		return 0, errors.Wrap(err, "failed to parse frame rate numerator")
	}

	if len(parts) == 1 {
		return num, nil
	}

	den, err := strconv.ParseFloat(parts[1], 64)
	if err != nil || den == 0 {
		// Unknown/invalid rate (ffprobe reports "0/0" for some streams);
		// treat it as 0 so the caller can fall back to its 30fps minimum.
		return 0, nil
	}

	return num / den, nil
}

func GetVideoStats(file string) (width int, height int, fps float64, duration time.Duration, audioStreams int, err error) {
	cmd := exec.Command("ffprobe", "-v", "error", "-show_entries", "format=duration:stream=width,height,r_frame_rate,index,codec_type:stream_side_data=rotation", "-sexagesimal", "-of", "json", file)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return 0, 0, 0, 0, 0, errors.Wrap(err, fmt.Sprintf("ffprobe failed: %s", out))
	}

	var info VideoInfo

	err = json.Unmarshal(out, &info)

	if err != nil {
		return 0, 0, 0, 0, 0, err
	}

	videoStream, ok := lo.Find(info.Streams, func(s StreamInfo) bool { return s.CodecType == "video" })

	if !ok {
		return 0, 0, 0, 0, 0, errors.New("no video stream found")
	}

	fps, err = parseFrameRate(videoStream.RFrameRate)

	if err != nil {
		return 0, 0, 0, 0, 0, err
	}

	audioStreams = lo.CountBy(info.Streams, func(s StreamInfo) bool { return s.CodecType == "audio" })

	dur, err := ParseSexagesimal(info.Format.Duration)

	if err != nil {
		return 0, 0, 0, 0, 0, err
	}

	// If the video is rotated 90 or 270 degrees swap the width and height
	if len(videoStream.SideDataList) > 0 {
		rotation := math.Abs(float64(videoStream.SideDataList[0].Rotation))

		if rotation == 90 || rotation == 270 {
			videoStream.Width, videoStream.Height = videoStream.Height, videoStream.Width
		}
	}

	return videoStream.Width, videoStream.Height, fps, dur, audioStreams, nil
}

func ParseSexagesimal(duration string) (time.Duration, error) {
	parts := strings.Split(strings.TrimSpace(duration), ":")

	if len(parts) != 3 {
		return 0, errors.New("invalid duration format")
	}

	hours, err := strconv.Atoi(strings.TrimSpace(parts[0]))

	if err != nil {
		return 0, errors.Wrap(err, "failed to parse hours")
	}

	minutes, err := strconv.Atoi(strings.TrimSpace(parts[1]))

	if err != nil {
		return 0, errors.Wrap(err, "failed to parse minutes")
	}

	seconds, err := strconv.ParseFloat(strings.TrimSpace(parts[2]), 64)

	if err != nil {
		return 0, errors.Wrap(err, "failed to parse seconds")
	}

	return time.Duration(hours)*time.Hour + time.Duration(minutes)*time.Minute + time.Duration(seconds*float64(time.Second)), nil
}

func (t *transcoder) GetPresets(width int, height int, fps float64, audioStreams int) []string {
	if fps < 30 {
		fps = 30
	}

	vertical := height > width
	aspectRatio := "16:9"

	if vertical {
		aspectRatio = "9:16"
		width, height = height, width
	}

	var presets []Quality
	for _, preset := range t.qualityPresets {
		if preset.Width <= width && preset.Height <= height && float64(preset.Framerate) <= fps+0.5 {
			targetPreset := preset
			if vertical {
				targetPreset.Width, targetPreset.Height = preset.Height, preset.Width
			}
			presets = append(presets, targetPreset)
		}
	}

	if len(presets) == 0 {
		presets = []Quality{t.qualityPresets[0]} // If no quality was select use the lowest one
	}

	ffmpegArgs := []string{
		"-aspect", aspectRatio,
		// Force IDRs at 2s boundaries so every representation has aligned
		// keyframes (required for seamless ABR switching and 2s DASH segments).
		"-force_key_frames", "expr:gte(t,n_forced*2)",
	}

	for i, preset := range presets {
		idx := strconv.Itoa(i)
		gop := strconv.Itoa(preset.Framerate * 2) // 2 seconds at this rendition's frame rate

		ffmpegArgs = append(ffmpegArgs,
			"-map",
			"v:0",
			"-s:v:"+idx,
			fmt.Sprintf("%dx%d", preset.Width, preset.Height),
			"-vf:"+idx,
			fmt.Sprintf("scale=w=%d:h=%d:force_original_aspect_ratio=1", preset.Width, preset.Height),
			"-b:v:"+idx,
			bitString(preset.Bitrate),
			"-maxrate:"+idx,
			bitString(preset.Bitrate*1.2),
			"-bufsize:"+idx,
			bitString(preset.Bitrate*2),
			"-r:v:"+idx,
			strconv.Itoa(preset.Framerate),
			"-g:v:"+idx,
			gop,
			"-keyint_min:v:"+idx,
			gop,
		)
	}

	return ffmpegArgs
}
