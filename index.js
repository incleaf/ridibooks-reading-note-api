'use strict'

const rp = require('request-promise')
const cheerio = require('cheerio')

const API_BASE_URL = 'https://ridibooks.com'


class RidiReadingNote {
  constructor({ userId, password }) {
    if (!userId || !password) {
      process.exitCode = 1
      throw new Error('userId and password must be provided')
    }
    this.userId = userId
    this.password = password
    this.isLoggedIn = false
  }

  request(url) {
    return rp(url, { jar: true })
  }

  async login() {
    const { userId, password, request } = this
    const currentTime = new Date().getTime()
    const loginURL = `${API_BASE_URL}/account/action/login?jsonp_callback=cb&user_id=${userId}&password=${password}&auto_login=0&_=${currentTime}`
    const loginBody = await request(loginURL)
    const res = JSON.parse(/{.*}/.exec(loginBody)[0])

    if (!res.success) {
      process.exitCode = 1
      throw new Error(res.message)
    }

    this.isLoggedIn = true
    return Promise.resolve()
  }

  async getBooks(cb) {
    if (!this.isLoggedIn) {
      await this.login()
    }

    const body = await this.request(`${API_BASE_URL}/reading-note/timeline`)
    const $body = cheerio.load(body)
    const items = await Promise.all(
      $body('.timeline_book_title a')
        .map((index, elem) => {
          return new Promise(async resolve => {
            const bookTitle = elem.children[0].data
            const path = elem.attribs.href
            const bookId = path.replace('/reading-note/detail/', '')
            const notes = await this.getNotes(bookId)

            resolve({ bookTitle, path, bookId, notes })
          })
        })
        .get()
    )

    if (typeof cb === 'function') {
      cb(items)
    }

    return items
  }

  async getNotes(bookId, cb) {
    if (!this.isLoggedIn) {
      await this.login()
    }

    const url = `${API_BASE_URL}/reading-note/detail/${bookId}`
    const body = await this.request(url)
    const $body = cheerio.load(body)
    const wordsCount = Number($body('#page_reading_note_detail .select_button .num').text())

    const res = []

    const offsets = []
    for (let i = 0; i < wordsCount; i += 20) {
      offsets.push(i)
    }

    return Promise.all(offsets.map(offset => {
      return new Promise(async resolve => {
        const wordsBody = await this.request(`${url}/load?offset=${offset}`)
        const $wordsBody = cheerio.load(wordsBody)
        const items = $wordsBody('.note_highlighter').map((v, elem) => {
          const text = elem.children[0].data
          const trimmedText = text
            .replace('\n', '')
            .trim()

          return trimmedText
        })
        res.push(...items.get())
        resolve()
      })
    })).then(() => {
      if (typeof cb === 'function') {
        cb(res)
      }

      return res
    })
  }
}

module.exports = RidiReadingNote
