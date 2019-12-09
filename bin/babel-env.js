#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const meow = require('meow')
const chalk = require('chalk')
//const mkdirp = require('mkdirp')
const fileExists = require('file-exists')
const isDirectory = require('is-directory')
const babel = require('@babel/core')
const presets = [
  require('@babel/preset-env'),
]

const cli = meow(`
  Usage
    $ babel-env <input.js>

  Options
    -h, --help   Show this help
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

async function readStdin() {
  let code = ''
  const stdin = process.stdin
  return new Promise(resolve => {
    stdin.setEncoding('utf8')
    stdin.on('readable', () => {
      const chunk = process.stdin.read()
      if (chunk !== null) code += chunk
    })
    stdin.on('end', () => {
      resolve(code)
    })
  })
}

async function handleStdin() {
  handleBuild({
    code: await readStdin(),
  })
}

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

async function handleFile() {
  handleBuild({
    from: findFile(cli.input[0], (err) => {
      console.error(chalk.red(`file not found: ${cli.input[0]}`))
      process.exit(1)
    }),
  })
}

function handleBuild(props) {
  props.to = cli.flags.output
  // build
  buildJS(props)
  // watch
  if (cli.flags.watch) {
    if (!props.from) {
      console.error(chalk.red(`cannot watch stdin`))
      process.exit(1)
    }
    const chokidar = require('chokidar')
    chokidar.watch(path.dirname(props.from), {
      ignored: props.to,
    }).on('change', () => {
      buildJS(props)
    })
  }
}

const transformJS = (file, code) => (
  file && babel.transformFileAsync(file, {
    presets,
  }) || code && babel.transformAsync(code, {
    presets,
  })
)

function buildJS(props) {
  const t0 = Date.now()
  transformJS(props.from, props.code).then(res => {
    const code = res.code + '\n'
    if (props.to) {
      fs.writeFile(props.to, code, err => {
        if (err) throw err
        const t1 = new Date()
        const ts = (t1.valueOf() - t0) / 1000
        console.log(`${code.length} bytes written to ${props.to} (${ts.toFixed(2)} seconds) at ${t1.toLocaleTimeString()}`)
      })
    } else {
      process.stdout.write(code)
    }
  }).catch(err => {
    console.error(err)
  })
}

if (!process.stdin.isTTY) {
  // stdin
  handleStdin()
} else if (cli.input.length === 1) {
  // file input
  handleFile()
} else if (cli.input.length > 1) {
  // invalid: more than one input
  console.error(chalk.red(`invalid input`))
  process.exit(1)
} else {
  // no input, show help
  cli.showHelp()
}
