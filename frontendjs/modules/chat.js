import DOMpurify from 'dompurify'

export default class Chat {
    constructor() {
        this.openedYet = false
        this.chatWrapper = document.querySelector("#chat-wrapper")
        this.openIcon = document.querySelector(".header-chat-icon")
    
        this.injectHTML()
        this.chatLog = document.querySelector("#chat")
        this.chatField = document.querySelector("#chatField")
        this.chatForm = document.querySelector("#chatForm")
        this.closeIcon = document.querySelector(".chat-title-bar-close")

        this.events()
    }

    //Events:
    events() {
        //setup listener for icon getting clicked on
        this.openIcon.addEventListener("click", () => this.showChat())
        this.closeIcon.addEventListener("click", () => this.hideChat())
        this.chatForm.addEventListener("submit", (e) => {
            //prevent default prevents a hard reload on the page
            e.preventDefault()
            this.sendMessageToServer()

        })
    }
    //Methods:
    showChat() {
        if(!this.openedYet) {
            this.openConnection()
        }
        this.openedYet = true
        this.chatWrapper.classList.add('chat--visible')
        this.chatField.focus()
    }
    hideChat() {
        this.chatWrapper.classList.remove('chat--visible')
    }

    injectHTML() {
        this.chatWrapper.innerHTML = `
        <div class="chat-title-bar">Chat <span class="chat-title-bar-close"><i class="fas fa-times-circle"></i></span></div>
        <div id="chat" class="chat-log"></div>

        <form id="chatForm" class="chat-form border-top">
        <input type="text" class="chat-field" id="chatField" placeholder="Type a message…" autocomplete="off">
        </form>
        `
    }

    openConnection() {
        //opens connection between browser and our http server
        this.socket = io()
        this.socket.on('Welcome', (data) => {
            this.username = data.username
        })
        this.socket.on('chatMessageFromServer', (data) => {
            this.displayMessageFromServer(data)
        })
    }

    sendMessageToServer() {
        this.socket.emit('chatMessageFromBrowser', {
            message: this.chatField.value
        })
        this.chatLog.insertAdjacentHTML('beforeend', `
        <div class="chat-self">
        <div class="chat-message">
          <div class="chat-message-inner">
           ${this.chatField.value}
          </div>
        </div>
         </div>
        `)
        this.chatLog.scrollTop = this.chatLog.scrollHeight
        this.chatField.value = ''
        this.chatField.focus()
    }

    displayMessageFromServer(data) {
        this.chatLog.insertAdjacentHTML('beforeend', DOMpurify.sanitize(`<div class="chat-other">
        <div class="chat-message"><div class="chat-message-inner">
          <a href="/profile/${data.username}"><strong>${data.username}:</strong></a>
          ${data.message}
        </div></div>
      </div>`))
      this.chatLog.scrollTop = this.chatLog.scrollHeight
    }
}