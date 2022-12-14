require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')

const app = express()

const Person = require('./models/person')

app.use(cors())

app.use(express.json())

app.use(express.static('build'))

morgan.token('body', (request, response) => {
  console.log(response.body)
  return JSON.stringify(request.body)
})
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))

// let persons = [
//   {
//     'id': 1,
//     'name': 'Arto Hellas',
//     'number': '040-123456'
//   },
//   {
//     'id': 2,
//     'name': 'Ada Lovelace',
//     'number': '39-44-5323523'
//   },
//   {
//     'id': 3,
//     'name': 'Dan Abramov',
//     'number': '12-43-234345'
//   },
//   {
//     'id': 4,
//     'name': 'Mary Poppendieck',
//     'number': '39-23-6423122'
//   }
// ]

app.get('/info', (request, response) => {
  Person.count((err, count) => {
    const datetime = new Date()

    response.send(`
            <p>Phonebook has info for ${count} people</p>
            <p>${datetime}</p>
        `)
  })
})

app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons => {
    response.json(persons)
  })
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
  const body = request.body

  if (body.name === undefined) {
    return response.status(400).json({ error: 'name missing' })
  }
  if (body.number === undefined) {
    return response.status(400).json({ error: 'number missing' })
  }

  let personExists = false
  Person.find({}).then(persons => {
    personExists = persons.map(person => person.name).includes(body.name)
  })
    .then(() => {
      const person = new Person({
        name: body.name,
        number: body.number,
      })

      if (personExists) {
        Person.findOneAndUpdate({ 'name': person.name }, { '$set': { 'name': person.name, 'number': person.number } }, { new: true })
          .then(() => {
            response.json(person)
          })
      } else {
        person.save()
          .then(() => {
            response.json(person)
          })
          .catch(error => next(error))
      }
    })
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then(() => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformed id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).send({ error: error.message })
  }

  next(error)
}
app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})