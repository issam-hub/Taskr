# Taskr

## Prerequisites

- Node.js: Ensure that Node.js is installed on your machine.
  You can download it from [here](https://nodejs.org).

## Install Project Dependency Packages

```
npm install
```

## Configuration

- create .env file in the root directory and save it. Inside that file, add the desired configuration values in the format KEY=VALUE (follow .env.example)

## Compile Project

Once you are in the project's root directory, you can use the
tsc command with the --watch flag to enable automatic
recompilation when changes are detected. Run the following
command

```
tsc --watch
```

## Run Project

- on local machine run during development

```
nodemon dist/src/main.js
```

- on server after development

```
node src/main.js
```
