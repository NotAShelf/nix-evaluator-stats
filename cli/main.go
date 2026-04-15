package main

import (
	"embed"
	b64 "encoding/base64"
	"fmt"
	"io/fs"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strconv"

	_ "embed"
)

//go:embed  all:dist
var website embed.FS

func main() {

	fileOrStringArgs := os.Args[1:]
	if len(fileOrStringArgs) != 1 {
		log.Fatal("To many Arguments Provided")
	}

	fileOrString := fileOrStringArgs[0]
	var base64 string
	if _, err := os.Stat(fileOrString); err == nil {

		data, err := os.ReadFile(fileOrString)
		if err != nil {
			fmt.Println("Failed to read File", err)
		}

		base64 = b64.StdEncoding.EncodeToString(data)
		
	} else {

		base64 = b64.StdEncoding.EncodeToString([]byte(fileOrString))
	}
	public, err := fs.Sub(website, "dist")
	if err != nil {
		log.Fatal(err)
	}

	fs := http.FileServerFS(public)
	http.Handle("/", fs)

	port := 10000 + rand.Intn(55000)
	fmt.Printf("Stats available at http://localhost:%d/?file=%s\n", port, base64)
	log.Fatal(http.ListenAndServe(":"+strconv.Itoa(port), nil))
}
