default: build

.PHONY: build run

cleanup:
	rm -rf ./build


build:
	npm run build

run:
	npm run test:watch


setup:
	npm install
