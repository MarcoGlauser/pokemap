
function loadImage(url,callback){
    var image_data = localStorage.getItem("image_data_" + url);
    var image_size = localStorage.getItem("image_size_" + url);

    if(image_data && image_size){
        callback(image_data,JSON.parse(image_size))
    }
    else{
        getDataUri(url,function (data_url,size) {
            localStorage.setItem("image_data_" + url,data_url);
            localStorage.setItem("image_size_" + url,JSON.stringify(size))
            callback(data_url,size)
        })
    }
}

function getDataUri(url, callback) {
    var image = new Image();

    image.onload = function () {
        var canvas = document.createElement('canvas');
        canvas.width = this.naturalWidth; // or 'width' if you want a special/scaled size
        canvas.height = this.naturalHeight; // or 'height' if you want a special/scaled size

        var context=canvas.getContext("2d");
        var scale = 0.3;
        context.drawImage(this, 0, 0,this.naturalWidth*scale,this.naturalHeight*scale);
        callback(canvas.toDataURL('image/png'),{width:canvas.width,height:canvas.height});
    };

    image.src = url;
}
