# ridibooks-reading-note-api

Unofficial ridibooks reading note API

## Install

```shell
$ npm install ridibooks-reading-note-api --save
```

> For yarn user: `yarn add ridibooks-reading-note-api`

## Usage

```javascript
const RidiReadingNote = require('ridibooks-reading-note-api')

const ridiReadingNote = new RidiReadingNote({ 
  userId: 'userId', 
  password: 'password', 
})

ridiReadingNote.getBooks(books => { console.log(books) })
ridiReadingNote.getBooks.then(books => { 
  console.log(books) 
})

ridiReadingNote.getNotes('106000156', notes => { console.log(notes) })
ridiReadingNote.getNotes('106000156').then(notes => { 
  console.log(notes) 
})
```

## API

### RidiReadingNote({ userId, password })

A constructor of module. userId and password must be provided.

### instance.getBooks([callback])

Returns a promise for an array of book data. Callback also supported.

```javascript
// Example Data
[{
  bookTitle: "노인과 바다 (영문판)", 
  path: "/reading-note/detail/106000156", 
  bookId: "106000156", 
  notes: ["Others, of the older fishermen, looked at him and were sad.", "noteangry"]
}]
```

### instance.getNotes(bookId, [callback])

Returns a promise for an array of note. Callback also supported.

```Javascript
// Example Data
["Others, of the older fishermen, looked at him and were sad.", "noteangry"]
```



