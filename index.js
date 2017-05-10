'use strict'

const rp = require('request-promise')
const cheerio = require('cheerio')

const API_BASE_URL = 'https://ridibooks.com'


function request(url) {
  return rp(url, { jar: true })
}

async function getNoteItems(_url) {
  const url = `${API_BASE_URL}${_url}`
  const body = await request(url)
  const $body = cheerio.load(body)
  const wordsCount = Number($body('#page_reading_note_detail .select_button .num').text())

  const res = []
  const offsets = []
  for (let i = 0; i < wordsCount; i += 20) {
    offsets.push(i)
  }
  return Promise.all(offsets.map(offset => {
    return new Promise(async resolve => {
      const wordsBody = await request(`${url}/load?offset=${offset}`)
      const $wordsBody = cheerio.load(wordsBody)
      const items = $wordsBody('.note_highlighter').map((v, elem) => {
        const text = elem.children[0].data
        const trimmedText = text
          .replace('\n', '')
          .trim()
          // .match(/[\w ]+/g)[0]
        return trimmedText
      })
      res.push(...items.get())
      resolve()
    })
  })).then(() => res)
}

async function getNotes() {
  const body = await request(`${API_BASE_URL}/reading-note/timeline`)
  const $body = cheerio.load(body)
  const items = await Promise.all(
    $body('.timeline_book_title a')
      .map((index, elem) => {
        return new Promise(async resolve => {
          const bookTitle = elem.children[0].data
          const url = elem.attribs.href
          const notes = await getNoteItems(url)

          resolve({ bookTitle, notes })
        })
      })
      .get()
  )

  return items
}

async function main({ userId, password }) {
  const currentTime = new Date().getTime()
  const loginURL = `${API_BASE_URL}/account/action/login?jsonp_callback=cb&user_id=${userId}&password=${password}&auto_login=0&_=${currentTime}`
  const loginBody = await request(loginURL)
  const res = JSON.parse(/{.*}/.exec(loginBody)[0])

  if (!res.success) {
    process.exitCode = 1
    throw new Error(res.message)
  }

  return await getNotes()
}

module.exports = main
