# Change log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).


## 0.3.0 (2016-02-17)

* :sparkles: default req as json if no other content-type specified


## 0.2.4 (2016-02-17)

* :sparkles: ability to automatically retry requests with `attempts_max` & `attempts_delay`


## 0.2.3 (2015-11-20)

* :sparkles: RUNNING state
* :bug: fix serialisation of errors with circular refs


## 0.2.2 (2015-10-16)

* :arrow_up: update npm deps


## 0.2.1 (2015-10-16)

* :bug: critical bug fixes in `request-processor`


## 0.2.0 (2015-10-14)

* :fire: remove kue & redis as dep (breaking change)
* :art: refactor various things with some ES6+ sugar
* :white_check_mark: 100% test coverage
* :sparkles: event emitter on queue


## 0.1.7 (2015-09-29)

* :bug: fix `PATCH` requests


## 0.1.6 (2015-09-24)

* :sparkles: add free-form `notes` field


## 0.1.5 (2015-09-15)

* :sparkles: timeturner exposing `RequestModel`
* :white_check_mark: add tests for timeturner exports


## 0.1.4 (2015-09-10)

* Remove install hook


## 0.1.3 (2015-09-10)

* Updated npm deps
* Open source


## 0.1.2 (2015-09-10)

* Make sure `headers` is exposed as `{}` if not set


## 0.1.1 (2015-09-07)

* Added `PATCH` support
* Default sorting by date
