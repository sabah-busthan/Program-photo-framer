document.addEventListener('DOMContentLoaded', function() {
    let cropper;
    const frameSettings = JSON.parse(localStorage.getItem('frameSettings'));

    if (!frameSettings) {
        console.error("Frame settings not found in localStorage.");
        return;
    }

    const frameImage = new Image();
    frameImage.src = frameSettings.frameImage;
    frameImage.onload = function() {
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');
        canvas.width = frameSettings.frameSize.width;
        canvas.height = frameSettings.frameSize.height;
        context.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
    };

    document.getElementById('upload-button').addEventListener('click', function() {
        const fileInput = document.getElementById('images');
        const files = Array.from(fileInput.files);

        if (files.length === 0) {
            alert('Please select image files.');
            return;
        }

        const processFile = (file) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.getElementById('primary-img');
                img.src = e.target.result;
                img.onload = function() {
                    document.getElementById('image-preview').classList.remove('hidden');

                    if (cropper) {
                        cropper.destroy();
                    }

                    const frameRatio = frameSettings.frameSize.width / frameSettings.frameSize.height;
                    cropper = new Cropper(img, {
                        aspectRatio: frameRatio,
                        viewMode: 1,
                        ready: function() {
                            document.getElementById('crop-image').classList.remove('hidden');
                            document.getElementById('upload-button').classList.add('hidden');
                            document.getElementById('images').classList.add('hidden');
                        }
                    });

                    document.getElementById('crop-image').addEventListener('click', function() {
                        if (!cropper) {
                            console.error("Cropper instance not found.");
                            return;
                        }

                        const croppedCanvas = cropper.getCroppedCanvas({
                            width: frameSettings.frameSize.width,
                            height: frameSettings.frameSize.height
                        });

                        const primaryImageDataUrl = croppedCanvas.toDataURL();
                        const finalImage = new Image();

                        finalImage.onload = function() {
                            const canvas = document.getElementById('canvas');
                            const context = canvas.getContext('2d');
                            context.clearRect(0, 0, canvas.width, canvas.height);
                            context.drawImage(finalImage, 0, 0, canvas.width, canvas.height);
                            context.drawImage(frameImage, 0, 0, canvas.width, canvas.height);

                            // Create a link and click it to download the image
                            const link = document.createElement('a');
                            link.href = canvas.toDataURL('image/png');
                            link.download = `merged-image-${Date.now()}.png`;
                            link.click();

                            // Process next image
                            if (files.length > 0) {
                                const nextFile = files.shift(); // Get the next file
                                processFile(nextFile);
                            } else {
                                // Reset the UI after all images have been processed
                                document.getElementById('upload-button').classList.remove('hidden');
                                document.getElementById('images').classList.remove('hidden');
                                document.getElementById('image-preview').classList.add('hidden');
                                document.getElementById('crop-image').classList.add('hidden');
                                fileInput.value = ''; // Clear file input
                            }
                        };

                        finalImage.src = primaryImageDataUrl;
                        cropper.destroy(); // Hide the cropper UI
                    });
                };
            };
            reader.readAsDataURL(file);
        };

        // Start processing the first file
        processFile(files.shift());
    });
});
