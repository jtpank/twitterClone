//JS running on client side!!!
//axios makes it easy to send off an async request to our server
import axios from 'axios'

export default class RegistrationForm {
    constructor() {
        //select by name
        this._csrf = document.querySelector('[name="_csrf"]').value
        //select by id (#)
        this.form = document.querySelector("#registration-form")
        //select by class (.)
        this.allFields = document.querySelectorAll("#registration-form .form-control")
        this.insertValidationElements()
        this.username = document.querySelector("#username-register")
        this.username.previousValue = ""
        this.email = document.querySelector("#email-register")
        this.email.previousValue = ""
        this.password = document.querySelector("#password-register")
        this.password.previousValue = ""
        this.username.isUnique = false
        this.email.isUnique = false
        this.events()
    }

    //Events
    events() {
        this.form.addEventListener("submit", (e) => {
            e.preventDefault()
            this.formSubmitHandler()
        })
        this.username.addEventListener("keyup", () => {
            this.isDifferent(this.username, this.usernameHandler)
        })
        this.email.addEventListener("keyup", () => {
            this.isDifferent(this.email, this.emailHandler)
        })
        this.password.addEventListener("keyup", () => {
            this.isDifferent(this.password, this.passwordHandler)
        })


        //bug handling:
        //blur is when field loses 'focus'
        this.username.addEventListener("blur", () => {
            this.isDifferent(this.username, this.usernameHandler)
        })
        this.email.addEventListener("blur", () => {
            this.isDifferent(this.email, this.emailHandler)
        })
        this.password.addEventListener("blur", () => {
            this.isDifferent(this.password, this.passwordHandler)
        })

    }
    //Methods
    isDifferent(el ,handler) {
        //check if fields value changed after keypress
        if(el.previousValue != el.value) {
            //has changed
            handler.call(this)
        }
        el.previousValue = el.value
    }

    usernameHandler() {
        //validation checks that run immediately should live
        this.username.errors = false
        this.usernameImmediately()
        //reset timer after delay on keystrokes (runs every keystroke)
        clearTimeout(this.username.timer)
        this.username.timer = setTimeout(() => this.usernameAfterDelay() , 700)
    }

    emailHandler() {
        //validation checks that run immediately should live
        this.email.errors = false
        //reset timer after delay on keystrokes (runs every keystroke)
        clearTimeout(this.email.timer)
        this.email.timer = setTimeout(() => this.emailAfterDelay() , 700)
    }

    passwordHandler() {
         //validation checks that run immediately should live
         this.password.errors = false
         this.passwordImmediately()
         //reset timer after delay on keystrokes (runs every keystroke)
         clearTimeout(this.password.timer)
         this.password.timer = setTimeout(() => this.passwordAfterDelay() , 700)
    }

    formSubmitHandler() {
        this.usernameImmediately()
        this.usernameAfterDelay()
        this.emailAfterDelay()
        this.passwordImmediately()
        this.passwordAfterDelay()

        if (
                this.username.isUnique && !this.username.errors &&
                this.email.isUnique && !this.email.errrors &&
                !this.password.errors
            ) {
            this.form.submit()
        }
    }

    usernameImmediately() {
        if(this.username.value != "" && !/^([a-zA-Z0-9]+)$/.test(this.username.value)) {
            this.showValidationError(this.username, "Username can only contain letters and numbers")
        }
        if(this.username.value.length > 30) {
            this.showValidationError(this.username, "Username must be less than 30 characters")
        }
        if(!this.username.errors) {
            this.hideValidationError(this.username)
        }
    }
    passwordImmediately() {
        if(this.password.value.length > 50) {
            this.showValidationError(this.password, "Password cannot exceed 50 characters")
        }
        if(!this.password.errors) {
            this.hideValidationError(this.password)
        }
    }
    hideValidationError(el) {
        el.nextElementSibling.classList.remove("liveValidateMessage--visible")
    }
    showValidationError(el, message) {
        el.nextElementSibling.innerHTML = message
        el.nextElementSibling.classList.add("liveValidateMessage--visible")
        el.errors = true
    }

    usernameAfterDelay() {
        if(this.username.value.length < 3) {
            this.showValidationError(this.username, "Username must be greater than 2 characters")
        }
        if(!this.username.errors) {
            axios.post('/doesUsernameExist', {_csrf: this._csrf, username: this.username.value}).then((response) => {
                if(response.data) {
                    this.showValidationError(this.username, "Username is already taken")
                    this.username.isUnique = false
                } else {
                    this.username.isUnique = true
                }
            }).catch(() => {
                //unexpected techinal difficulty
                console.log("try later")
            })
        }
    }
    emailAfterDelay() {
        //evaluate to true for <text>@<text>
        if(!/^\S+@\S+$/.test(this.email.value)) {
            this.showValidationError(this.email, "Must provide valid email address")
        }
        if(!this.email.errors) {
            axios.post('/doesEmailExist', {_csrf: this._csrf, email: this.email.value}).then((response) => {
                if(response.data) {
                    this.email.isUnique = false
                    this.showValidationError(this.email, "Email is already taken")
                } else {
                    this.email.isUnique = true
                    this.hideValidationError(this.email)
                }
            }).catch(() => {
                //unexpected techinal difficulty
                console.log("try later")
            })
        }
    }
    passwordAfterDelay() { 
        if(this.password.value.length < 8)  {
            this.showValidationError(this.password, "Password must be 8 or more characters")
        }
    }

    insertValidationElements() {
        this.allFields.forEach((el) => {
            el.insertAdjacentHTML('afterend', '<div class="alert alert-danger small liveValidateMessage">BLAH</div>')
        })

    }
} 