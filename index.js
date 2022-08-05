require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const { isWebUri } = require('valid-url')
const mongoose = require('mongoose')

app.use(cors({ optionsSuccessStatus: 200 }))
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html')
})

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

const shortUrlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    index: true,
    unique: true
  },
  id: Number
})

const ShortUrl = mongoose.model('ShortUrl', shortUrlSchema)

const findOneByUrl = (url, done) => {
  ShortUrl
    .findOne({ original_url: url }, (err, doc) => {
      if (err) {
        return done(err)
      }
      done(null, doc)
    })
}

const findOneById = (id, done) => {
  ShortUrl
    .findOne({ id: id }, (err, doc) => {
      if (err) {
        return done(err)
      }
      done(null, doc)
    })
}

const createNewShortUrl = (url, done) => {
  let incrementId = 1
  ShortUrl.findOne()
    .sort({ id: -1 })
    .exec(function (err, result) {
      if (err) {
        return done(err)
      }

      incrementId = result ? result.id + 1 : 1

      new ShortUrl({
        original_url: url,
        id: incrementId,
      }).save((err, doc) => {
        if (err) {
          return done(err)
        }
        done(null, doc)
      })

    })
}

app.post('/api/shorturl', (req, res) => {
  const { url } = req.body

  if (!isWebUri(url)) {
    return res.json({ error: 'invalid url' })
  }

  findOneByUrl(url, (err, doc) => {
    if (err) {
      return res.json(err)
    }

    if (doc) {
      return res.json({ original_url: doc.original_url, short_url: doc.id })
    }

    createNewShortUrl(url, (err, doc) => {
      if (err) {
        return res.json(err)
      }
      res.json({ original_url: doc.original_url, short_url: doc.id })
    })
  })
})

app.get('/api/shorturl/:id', (req, res) => {
  const { id } = req.params

  findOneById(id, (err, doc) => {
    if (err) {
      return res.json(err)
    }
    if (doc === null) {
      return res.json({ error: 'Short url not found' })
    }
    res.redirect(doc.original_url)
  })
})

const listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port)
})