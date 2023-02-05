document.addEventListener('DOMContentLoaded', function() {

    const video = document.querySelector('video');

    let canvasWidth = 640;
    let canvasHeight = 360;
    let scale = 0.5;
    const workers = 5;
    let ocrInterval = 67;

    let videoConstraints = {
        focusMode: 'continuous',
        frameRate: { ideal: 30 },
        width: { min: 720 },
        // height: { min: 1280 }
    };

    videoConstraints.facingMode = { exact: 'environment' };

    navigator.mediaDevices.getUserMedia(
        {
            video: videoConstraints,
            audio: false
        }
    ).then((stream) => {
        video.srcObject = stream;
        stream.getTracks().forEach(function(track) {
            console.log(track.getSettings());

            addMessage(JSON.stringify(track.getSettings()));

            canvasHeight = track.getSettings().height;
            canvasWidth = track.getSettings().width;
        });
    });

    const { createWorker, createScheduler } = Tesseract;
    const scheduler = createScheduler();

    video.style.display = 'none';
    const messages = document.getElementById('messages');
    let timerId = null;

    const addMessage = (m, bold) => {
        let msg = `<p>${m}</p>`;
        if (bold) {
        msg = `<p class="bold">${m}</p>`;
        }
        messages.innerHTML += msg;
        messages.scrollTop = messages.scrollHeight;
    }

    const doOCR = async () => {
        const c = document.querySelector('canvas');
        c.height = canvasHeight * scale;
        c.width = canvasWidth * scale;
        c.getContext('2d').drawImage(video, 0, 0, canvasWidth * scale, canvasHeight * scale);
        const start = new Date();
        const { data: { text } } = await scheduler.addJob('recognize', c);
        const end = new Date()
        text.split('\n').forEach((result) => {
            // console.log(result);

            if (!result)
            {
                return;
            }

            const onlyNumbers = result.trim().replace(/\D/g,'');

            if (!onlyNumbers || onlyNumbers.length != 22) {
                return;
            }

            addMessage(`[${start.getMinutes()}:${start.getSeconds()} - ${end.getMinutes()}:${end.getSeconds()}], ${(end - start) / 1000} s`);
            addMessage('Code: ' + onlyNumbers);
            alert('Code: ' + onlyNumbers);
        });
    };

    (async () => {
        addMessage('Initializing Tesseract.js');
        for (let i = 0; i < workers; i++) {
            const worker = createWorker();
            await worker.load();
            await worker.loadLanguage('eng');
            await worker.initialize('eng');
            scheduler.addWorker(worker);
        }
        addMessage('Initialized Tesseract.js');
        video.addEventListener('play', () => {
            timerId = setInterval(doOCR, ocrInterval);
        });
        video.addEventListener('pause', () => {
            clearInterval(timerId);
        });
        video.play();
    })();
});