#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const meow = require('meow')
const chalk = require('chalk')
//const mkdirp = require('mkdirp')
const fileExists = require('file-exists')
const isDirectory = require('is-directory')

const cli = meow(`
  Usage
    $ babel-env <input.js>

  Options
    -o, --output Output file
    -w, --watch  Watch JS source directory for changes

  Example
    $ babel-env src/hello.js -o dist/bundle.js
    $ babel-env src/hello.js -o dist/bundle.js --watch
`, {
  flags: {
    help: {
      type: 'boolean',
      alias: 'h',
    },
    output: {
      type: 'string',
      alias: 'o',
    },
    watch: {
      type: 'boolean',
      alias: 'w',
    },
  },
})

if (!cli.input[0]) {
  cli.showHelp()
}

const inputFile = findFile(cli.input[0], (err) => {
  console.error(chalk.red(`file not found: ${cli.input[0]}`))
  process.exit(1)
})

function findFile(input, cb) {
  if (isDirectory.sync(input)) {
    return findFile(path.join(input, 'index.js'), cb)
  } else if (fileExists.sync(input)) {
    return input
  } else if (fileExists.sync(input + '.js')) {
    return input + '.js'
  } else {
    cb()
  }
}

const outputFile = cli.flags.output

const babel = require('@babel/core')
const presets = [
  require('@babel/preset-env'),
]

buildJS()

if (cli.flags.watch) {
  const chokidar = require('chokidar')
  chokidar.watch(path.dirname(inputFile), {
    ignored: outputFile,
  }).on('change', () => {
    buildJS()
  })
}

function buildJS() {
  const t0 = Date.now()
  babel.transformFileAsync(inputFile, {
    presets,
  }).then(res => {
    const code = res.code + '\n'
    if (outputFile) {
      fs.writeFile(outputFile, code, err => {
        if (err) throw err
        const t1 = new Date()
        const ts = (t1.valueOf() - t0) / 1000
        console.log(`${code.length} bytes written to ${outputFile} (${ts.toFixed(2)} seconds) at ${t1.toLocaleTimeString()}`)
      })
    } else {
      process.stdout.write(code)
    }
  }).catch(err => {
    console.error(err)
  })
}
