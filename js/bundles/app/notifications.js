const markup = (msg) => `<div class="alert-box">
    <div class="alert-content">${msg}</div>
    <a class="alert-close no-loader" data-close href="#"></a>
</div>`

var idcounter = 0;

export class Notification {
    constructor(id, msgid, option = { hideCloseButton: false, persistent: true, closeTime: 5000 }) {
        this.id = id;
        this.option = option;

        if (!msgid)
            msgid = "notification" + idcounter;

        this.msgid = msgid;
    }
    show(msg) {
        if (this.disperseTimeout) clearTimeout(this.disperseTimeout);
        this.disperseTimeout = null;
        ++idcounter;

        if (!msg)
            throw new Error("msg parameter is empty");

        // Remove existing notification with same id
        let oldmsg = document.getElementById(this.msgid);
        if (oldmsg) oldmsg.remove();

        // Create new one
        let template = document.createElement('template')
        template.innerHTML = markup(msg);
        let newElement = template.content

        if (this.option.hideCloseButton) {
            newElement.querySelector(".alert-close").classList.add("d-none");
        }

        var linksThatClose = newElement.querySelectorAll("a[data-close]");
        linksThatClose.forEach(link => {
            link.addEventListener('click', event => {
                event.preventDefault();
                this.hide();
            });
        })
        newElement.querySelector("div").id = this.msgid;

        // Add new one
        let target = document.getElementById(this.id);
        target.appendChild(newElement);

        if (this.option.persistent) return;

        if (this.alertTimeout) clearTimeout(this.alertTimeout);
        this.alertTimeout = setTimeout(() => {
            this.alertTimeout = null;
            this.hide();
        }, this.option.closeTime);
    };
    remove() {
        if (this.disperseTimeout) clearTimeout(this.disperseTimeout);
        this.disperseTimeout = null;

        let oldmsg = document.getElementById(this.msgid);
        if (oldmsg) oldmsg.remove();
    }
    hide() {
        let oldmsg = document.getElementById(this.msgid);
        if (oldmsg) {
            oldmsg.classList.add('hide');
            this.disperseTimeout = setTimeout(() => this.remove(), 500);
        }
    };
}