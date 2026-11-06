let scrollY = 0;

// Prevent mouse hovers from showing tool tips. For one, they are lame. And two, I use titles
// to better effect in the gallery
function syncViewerDescriptionSize(activeImage) {
    const description = document.getElementById('viewerDescriptionContainer');
    if (!description || !activeImage) {
        return;
    }

    description.style.width = `${activeImage.clientWidth}px`;
    description.style.height = '';
    description.style.visibility = 'visible'; // Set hidden below in image loader and in css
}

function suppressImageTitleTooltip(event) {
    const img = event.target.closest('img[title]');
    if (!img) {
        return;
    }

    img.dataset.savedTitle = img.getAttribute('title');
    img.removeAttribute('title');
}

function restoreImageTitleTooltip(event) {
    const img = event.target.closest('img');
    if (!img || !img.dataset.savedTitle) {
        return;
    }

    img.setAttribute('title', img.dataset.savedTitle);
    delete img.dataset.savedTitle;
}

document.addEventListener('mouseover', suppressImageTitleTooltip, true);
document.addEventListener('mouseout', restoreImageTitleTooltip, true);
document.addEventListener('focusin', suppressImageTitleTooltip, true);
document.addEventListener('focusout', restoreImageTitleTooltip, true);

function toggleViewer(tgtID=null) {
    var viewer = document.getElementById("viewerContainer");

    if (viewer.style.display == "none") {  // show overlay
        scrollY = window.scrollY || window.pageYOffset;
        document.body.style.top = `-${scrollY}px`;
        document.body.classList.add('noscroll');
        document.body.classList.remove('scroll');

        viewer.style.display = "block";

        if (tgtID != null) {
            var tgtImage = document.querySelector('[data-id="__' + tgtID + '"]');
            if (!tgtImage) {
                // the "show gallery" link references an image that isn't in the post, so it won't have a data-id. Just an id.
                tgtImage = document.querySelector('[id="__' + tgtID + '"]');
            }
            showImage(tgtImage);
        }
    }
    else { // Hide overlay
        document.body.classList.remove('noscroll');
        document.body.classList.add('scroll');
        document.body.style.top = '';
        window.scrollTo(0, scrollY);

        viewer.style.display = "none";
    }
}

document.onkeyup = function(evt) {
    evt = evt || window.event;
    var escPressed = false;
    var rightArrow = false;
    var leftArrow = false;
    if ("key" in evt) {
        escPressed = (evt.key === "Escape" || evt.key === "Esc");
        rightArrow = (evt.key === "ArrowRight" || evt.key === "ArrowUp");
        leftArrow = (evt.key === "ArrowLeft" || evt.key === "ArrowDown");
    }
    else {
        escPressed = (evt.keyCode === 27);
        rightArrow = (evt.key === 39);
        leftArrow = (evt.key === 37);
    }

    if (escPressed) {
        var viewer = document.getElementById("viewerContainer");
        if (viewer.style.display != "none") {
            toggleViewer();
        }
    }

    if (rightArrow) {
        var currentlySelected = document.getElementsByClassName('pickerSelectedImage');
        next = currentlySelected[0].nextElementSibling;
        if (next) {
            showImage(next);
        }
    }

    if (leftArrow) {
        var currentlySelected = document.getElementsByClassName('pickerSelectedImage');
        next = currentlySelected[0].previousElementSibling;
        if (next) {
            showImage(next);
        }
    }

}

function showImage(img) {
    var currentlySelected = document.getElementsByClassName('pickerSelectedImage');
    for(element of currentlySelected) {
        element.classList.remove('pickerSelectedImage');
    }

    pathSegments = img.src.split('/');
    imgName = pathSegments[pathSegments.length - 1];
    // Build the path to the full image from the inline image path. It'll already have the topic baked in.
    imgFullPath = pathSegments.slice(0, pathSegments.length - 2).join('/');
    imgFullPath = imgFullPath + '/full';

    // An mp4 will share the same basename as their preview image, but we get a ".jpg" here. 
    // Swap it out for .mp4 
    if (img.dataset.isVideo) {
        const lastDotIdx = imgName.lastIndexOf(".");
        const parts = lastDotIdx === -1 ? [imgName] : [imgName.slice(0, lastDotIdx), imgName.slice(lastDotIdx+1)];
        parts[parts.length - 1] = "mp4";
        imgName = parts.join(".");

        innerHTML = '<video controls autoplay class="viewerImage"><source src="' + imgFullPath + '/' + imgName + '" type="video/mp4">';
    }
    else {
        innerHTML = '<img src="' + imgFullPath + '/' + imgName + '" class="viewerImage">';
    }

    imgViewer = document.getElementById('viewerImageContainer');
    imgViewer.innerHTML = innerHTML;
    const activeImage = imgViewer.querySelector('.viewerImage');
    if (activeImage) {
        const description = document.getElementById('viewerDescriptionContainer');
        description.style.visibility = 'hidden';

        if (img.dataset.isVideo) {
            // Future Jim: This works, syncViewerDescriptionSize gets called, but we also want
            //             native controls on the video and those will underlap the description.
            //             It's possible to have the description move to the left or right for
            //             just videos, but it'll require syncViewerDescriptionSize to know it's
            //             a video and the relative size it's being displayed at. That sounds
            //             like a lot of work and Current Jim is really lazy.
            // activeImage.addEventListener('loadedmetadata', function() {
            //     syncViewerDescriptionSize(activeImage);
            // }, { once: true });
        }
        else {
            activeImage.addEventListener('load', function() {
                syncViewerDescriptionSize(activeImage);
            }, { once: true });
        }

        if (activeImage.complete) {
            syncViewerDescriptionSize(activeImage);
        }
    }

    // Look for an img with the same data-id. We'll grab the title/alt deets from there.
    // Remember: the title may have been suppressed to keep tooltips from showing.
    // Future Jim: You have an interesting situation here. Blog images have img.dataset.ids,
    //             gallery thumbnails have img.ids. When you first click on a blog image,
    //             this function is passed the blog image, not the thumbnail image. So the 
    //             nomenclature in this next part is inverted, but it still works
    //             (blogImg will not be found, but the fallback to img will, since that's
    //             actually the blogImg). This is why if we find blogImg, we decorate
    //             the passed in image (a gallery thumbail) with pickerSelectedImage and we 
    //             look for an image to decorate when we don't (we were given a blog image).
    //             You might just want to make this a bit more straightforward and have 
    //             the start of this function figure out the right thumbnail image up front.
    //             Just sayin'
    var desc = null;
    blogImg = document.querySelector('[data-id="' + img.id + '"]');
    if (blogImg) {
        desc = blogImg.title ? blogImg.title : 
                blogImg.dataset.savedTitle ? blogImg.dataset.savedTitle :
                blogImg.alt ? blogImg.alt : null;

        img.classList.add('pickerSelectedImage');
    }
    if (desc == null) {
        // No matching image. Either I forgot to add one or this is a gallery-only image
        // Or this is blog image. Read the wall of text above.
        desc = img.title ? img.title : 
                img.dataset.savedTitle ? img.dataset.savedTitle :
                img.alt ? img.alt : null;


        if (img.dataset.id) {
            thumbnailImg = document.querySelector('[id="' + img.dataset.id + '"]');
        }
        else {
            thumbnailImg = img;
        }
        thumbnailImg.classList.add('pickerSelectedImage');
    }
    if (desc == null) {
        // ...fine. Just the filename then. yeesh!
        desc = imgName;
    }

    const descContainer = document.querySelector("#viewerDescriptionContainer");
    descContainer.innerHTML = desc;
}

window.addEventListener('resize', function() {
    const activeImage = document.querySelector('#viewerImageContainer .viewerImage');
    syncViewerDescriptionSize(activeImage);
});
