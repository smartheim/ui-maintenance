class UiYoutube extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.classList.add("youtube");
        this.videoid = this.getAttribute("videoid") || null;
        this.videoparams = this.getAttribute("videoparams") || null;

        // Based on the YouTube ID, we can easily find the thumbnail image
        this.style.backgroundImage = 'url(http://i.ytimg.com/vi/' + this.videoid + '/sddefault.jpg)';

        // Overlay the Play icon to make it look like a video player
        var play = document.createElement("div");
        play.setAttribute("class", "play");
        play = this.appendChild(play);

        this.onclick = function () {
            // Create an iFrame with autoplay set to true
            var iframe = document.createElement("iframe");
            var iframe_url = "https://www.youtube.com/embed/" + this.videoid + "?autoplay=1&autohide=1";
            if (this.videoparams) iframe_url += '&' + this.videoparams;
            iframe.setAttribute("src", iframe_url);
            iframe.setAttribute("frameborder", '0');
            iframe.setAttribute("allowfullscreen", 'true');
            iframe.setAttribute("allow", 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture');

            // The height and width of the iFrame should be the same as parent
            iframe.style.width = this.style.width;
            iframe.style.height = this.style.height;

            // Replace the YouTube thumbnail with YouTube Player
            play.remove();
            this.appendChild(iframe);
        }
    }
}

customElements.define('ui-youtube', UiYoutube);
