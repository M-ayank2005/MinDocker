package registry

import (
	"archive/tar"
	"compress/gzip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/go-containerregistry/pkg/name"
	"github.com/google/go-containerregistry/pkg/v1/remote"
)

func PullImage(imageRef, destDir string) error {
	// Normalize docker hub references
	if !strings.Contains(imageRef, "/") && !strings.Contains(imageRef, ":") {
		imageRef = "library/" + imageRef + ":latest"
	}
	ref, err := name.ParseReference(imageRef)
	if err != nil {
		return err
	}

	fmt.Printf("Pulling image %s...\n", ref.Name())
	img, err := remote.Image(ref)
	if err != nil {
		return err
	}

	layers, err := img.Layers()
	if err != nil {
		return err
	}

	if err := os.MkdirAll(destDir, 0755); err != nil {
		return err
	}

	for i, layer := range layers {
		fmt.Printf("Extracting layer %d...\n", i)
		rc, err := layer.Compressed()
		if err != nil {
			return err
		}
		defer rc.Close()

		if err := extractTarGz(rc, destDir); err != nil {
			return fmt.Errorf("layer extraction failed: %v", err)
		}
	}
	return nil
}

func extractTarGz(gzipStream io.Reader, destDir string) error {
	uncompressedStream, err := gzip.NewReader(gzipStream)
	if err != nil {
		return err
	}
	defer uncompressedStream.Close()

	tarReader := tar.NewReader(uncompressedStream)
	for {
		header, err := tarReader.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}

		target := filepath.Join(destDir, header.Name)
		switch header.Typeflag {
		case tar.TypeDir:
			os.MkdirAll(target, 0755)
		case tar.TypeReg:
			os.MkdirAll(filepath.Dir(target), 0755)
			outFile, err := os.OpenFile(target, os.O_CREATE|os.O_RDWR, os.FileMode(header.Mode))
			if err == nil {
				io.Copy(outFile, tarReader)
				outFile.Close()
			}
		case tar.TypeSymlink:
			os.Symlink(header.Linkname, target)
		case tar.TypeLink:
			os.Link(filepath.Join(destDir, header.Linkname), target)
		}
	}
	return nil
}
