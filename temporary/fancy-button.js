class FancyButton extends HTMLButtonElement {
    constructor() {
      super(); // always call super() first in the constructor.
      this.addEventListener('click', e => this.drawRipple(e.offsetX, e.offsetY));
    }
  
    // Material design ripple animation.
    drawRipple(x, y) {
      let div = document.createElement('div');
      div.classList.add('ripple');
      this.appendChild(div);
      div.style.top = `${y - div.clientHeight/2}px`;
      div.style.left = `${x - div.clientWidth/2}px`;
      div.style.backgroundColor = 'currentColor';
      div.classList.add('run');
      div.addEventListener('transitionend', e => div.remove());
    }
  }
  
  customElements.define('fancy-button', FancyButton, {extends: 'button'});
  // Usage: <button is="fancy-button" disabled>Fancy button!</button>