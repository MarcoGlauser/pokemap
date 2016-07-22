
function loadImage(url,callback){
    var image_data = localStorage.getItem("image_data_" + url);
    if(image_data){
        callback(image_data)
    }
    else{
        getDataUri(url,function (data_url) {
            localStorage.setItem("image_data_" + url,data_url);
            callback(data_url)
        })
    }
}

function getDataUri(url, callback) {
    var image = new Image();

    image.onload = function () {
        var canvas = document.createElement('canvas');
        canvas.width = this.naturalWidth; // or 'width' if you want a special/scaled size
        canvas.height = this.naturalHeight; // or 'height' if you want a special/scaled size

        canvas.getContext('2d').drawImage(this, 0, 0);

        callback(canvas.toDataURL('image/png'));
    };

    image.src = url;
}
