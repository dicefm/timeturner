default: build

.PHONY: build run

cleanup:
	rm -rf ./build


build:
	npm run build

run:
	DEBUG=dice* npm run test:watch

express:
	DEBUG=dice* nodemon ./examples/express

setup:
	npm install
