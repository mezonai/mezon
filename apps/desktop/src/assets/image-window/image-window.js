document.addEventListener('DOMContentLoaded', () => {
	// image channel data
	let currentData = null;
	let currentIndex = 0;
	let currentRotation = 0;
	let currentZoom = 1;
	let isThumbnailListVisible = true;

	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString();
	}

	function formatDateTime(dateString) {
		const options = {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		};
		return new Date(dateString).toLocaleString('vi-VN', options);
	}

	function updateImageTransform() {
		const selectedImage = document.getElementById('selectedImage');
		selectedImage.style.transform = `rotate(${currentRotation}deg) scale(${currentZoom})`;
	}

	function resetImageTransform() {
		currentRotation = 0;
		currentZoom = 1;
		updateImageTransform();
	}

	function updateSelectedImage(image, index) {
		const selectedImage = document.getElementById('selectedImage');
		const userAvatar = document.getElementById('userAvatar');
		const username = document.getElementById('username');
		const timestamp = document.getElementById('timestamp');

		selectedImage.src = image.url;
		userAvatar.src = image.uploaderData.avatar;
		username.textContent = image.uploaderData.name;
		timestamp.textContent = formatDateTime(image.create_time);

		currentIndex = index;
		resetImageTransform();

		// Update active thumbnail
		const thumbnailContainer = document.getElementById('thumbnails');
		const thumbnails = document.querySelectorAll('.thumbnail');
		thumbnails.forEach((thumb, idx) => {
			if (idx === index) {
				thumb.classList.add('active');
				setTimeout(() => {
					thumb.scrollIntoView({
						behavior: 'smooth',
						block: 'center'
					});
				}, 0);
			} else {
				thumb.classList.remove('active');
			}
		});
	}

	function navigateImage(direction) {
		if (!currentData) return;

		const images = currentData?.images;
		let newIndex = currentIndex + direction;

		if (newIndex >= images.length) newIndex = 0;
		if (newIndex < 0) newIndex = images.length - 1;

		updateSelectedImage(images[newIndex], newIndex);
	}

	function downloadImage() {
		if (!currentData) return;

		const image = currentData?.images[currentIndex];
		const link = document.createElement('a');
		link.href = image.url;
		link.download = image.filename || 'image';
		link.click();
	}

	function toggleThumbnailList() {
		const thumbnailContainer = document.getElementById('thumbnails');
		isThumbnailListVisible = !isThumbnailListVisible;
		thumbnailContainer.classList.toggle('hidden', !isThumbnailListVisible);
	}

	function handleAttachmentData(data) {
		currentData = data;
		const thumbnailContainer = document.getElementById('thumbnails-content');
		thumbnailContainer.innerHTML = '';

		const channelLabel = document.getElementById('channel-label');
		channelLabel.innerHTML = data.channelLabel;

		data?.images.forEach((image, index) => {
			const wrapper = document.createElement('div');
			wrapper.className = 'thumbnail-wrapper';

			const currentDate = formatDate(image.create_time);
			const prevDate = index > 0 ? formatDate(data?.images[index - 1].create_time) : null;

			if (currentDate !== prevDate) {
				const dateLabel = document.createElement('div');
				dateLabel.className = 'date-label';
				dateLabel.textContent = currentDate;
				wrapper.appendChild(dateLabel);
			}

			const thumbnail = document.createElement('img');
			thumbnail.src = image.url;
			thumbnail.className = 'thumbnail';
			thumbnail.alt = image.filename;
			thumbnail.addEventListener('click', () => updateSelectedImage(image, index));

			wrapper.appendChild(thumbnail);
			thumbnailContainer.appendChild(wrapper);

			if (index === data.selectedImageIndex) {
				updateSelectedImage(image, index);
			}
		});
	}

	document.addEventListener('keydown', (e) => {
		switch (e.key) {
			case 'ArrowUp':
				navigateImage(-1);
				break;
			case 'ArrowDown':
				navigateImage(1);
				break;
		}
	});

	document.getElementById('downloadBtn').addEventListener('click', downloadImage);

	document.getElementById('rotateLeftBtn').addEventListener('click', () => {
		currentRotation -= 90;
		updateImageTransform();
	});

	document.getElementById('rotateRightBtn').addEventListener('click', () => {
		currentRotation += 90;
		updateImageTransform();
	});

	document.getElementById('zoomInBtn').addEventListener('click', () => {
		currentZoom = currentZoom + 1.5;
		updateImageTransform();
	});

	function handleWheel(e) {
		e.preventDefault();
		const delta = e.deltaY * -0.001;
		currentZoom = Math.max(1, Math.min(currentZoom + delta, 5));
		updateImageTransform();
	}

	const selectedImage = document.getElementById('selectedImage');
	selectedImage.addEventListener('wheel', handleWheel, { passive: false });

	document.getElementById('resetBtn').addEventListener('click', resetImageTransform);

	document.getElementById('toggleListBtn').addEventListener('click', toggleThumbnailList);

	document.getElementById('minimize-window').addEventListener('click', () => {
		window.electron.send('APP::IMAGE_WINDOW_TITLE_BAR_ACTION', 'APP::MINIMIZE_WINDOW');
	});

	document.getElementById('maximize-window').addEventListener('click', () => {
		window.electron.send('APP::IMAGE_WINDOW_TITLE_BAR_ACTION', 'APP::MAXIMIZE_WINDOW');
	});

	document.getElementById('close-window').addEventListener('click', () => {
		window.electron.send('APP::IMAGE_WINDOW_TITLE_BAR_ACTION', 'APP::CLOSE_APP');
	});

	window.electron.on('APP::SET_ATTACHMENT_DATA', (event, data) => {
		handleAttachmentData(data);
	});
});
