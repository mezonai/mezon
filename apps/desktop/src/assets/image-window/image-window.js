document.addEventListener('DOMContentLoaded', () => {
	// image channel data
	let currentData = null;
	let currentIndex = 0;
	let currentRotation = 0;
	let currentZoom = 1;
	let currenPosition = {
		x: 0,
		y: 0
	};
	let dragstart = {
		x: 0,
		y: 0
	};
	let dragStatus = false;
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
		selectedImage.style.transform = `rotate(${currentRotation}deg) translate(0,0) scale(${currentZoom})`;
	}

	function resetImageTransform() {
		currentRotation = 0;
		currentZoom = 1;
		currenPosition = {
			x: 0,
			y: 0
		};
		updateImageTransform();
	}

	function updateSelectedImage(image, index, firstLoad = false) {
		const selectedImage = document.getElementById('selectedImage');
		const userAvatar = document.getElementById('userAvatar');
		const username = document.getElementById('username');
		const timestamp = document.getElementById('timestamp');

		if (!firstLoad) {
			selectedImage.src = image.url;
		}
		userAvatar.src = image.uploaderData.avatar;
		username.textContent = image.uploaderData.name;
		timestamp.textContent = formatDateTime(image.create_time);

		if (index !== undefined) {
			currentIndex = index;
			resetImageTransform();

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
	const handleMouseDown = (event) => {
		dragStatus = true;
		dragstart = {
			x: event.clientX - currenPosition.x,
			y: event.clientY - currenPosition.y
		};
	};

	const handleMouseUp = (event) => {
		dragStatus = false;
		event.stopPropagation();
	};
	function handleDrag(e) {
		if (currentZoom > 1 && dragStatus) {
			currenPosition = {
				x: e.clientX - dragstart.x,
				y: e.clientY - dragstart.y
			};
			selectedImage.style.transform = `scale(${currentZoom}) translate(${currenPosition.x / currentZoom}px, ${currenPosition.y / currentZoom}px) `;
		}
	}

	function handleAttachmentData(data) {
		currentData = data;
		const thumbnailContainer = document.getElementById('thumbnails-content');
		thumbnailContainer.innerHTML = '';

		const channelLabel = document.getElementById('channel-label');
		channelLabel.innerHTML = data?.channelLabel;

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

			// SET FIRST SELECT IMAGE WHEN OPEN IMAGE WINDOW
			if (index === data.selectedImageIndex) {
				updateSelectedImage(image, index, true);
			}
		});
	}

	const closeImageWindow = () => {
		window.electron.send('APP::IMAGE_WINDOW_TITLE_BAR_ACTION', 'APP::CLOSE_APP');
	};

	document.addEventListener('keydown', (e) => {
		switch (e.key) {
			case 'ArrowUp':
				navigateImage(-1);
				break;
			case 'ArrowLeft':
				navigateImage(-1);
				break;
			case 'ArrowDown':
				navigateImage(1);
				break;
			case 'ArrowRight':
				navigateImage(1);
				break;
			case 'Escape':
				closeImageWindow();
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
	selectedImage.addEventListener('dragstart', (e) => {
		e.preventDefault();
		e.stopPropagation();
	});
	selectedImage.addEventListener('mousemove', handleDrag);
	selectedImage.addEventListener('mousedown', handleMouseDown);
	// selectedImage.addEventListener('mouseup', handleMouseUp);
	document.addEventListener('mouseup', handleMouseUp);
	document.getElementById('resetBtn').addEventListener('click', resetImageTransform);

	document.getElementById('toggleListBtn').addEventListener('click', toggleThumbnailList);

	document.getElementById('minimize-window').addEventListener('click', () => {
		window.electron.send('APP::IMAGE_WINDOW_TITLE_BAR_ACTION', 'APP::MINIMIZE_WINDOW');
	});

	document.getElementById('maximize-window').addEventListener('click', () => {
		window.electron.send('APP::IMAGE_WINDOW_TITLE_BAR_ACTION', 'APP::MAXIMIZE_WINDOW');
	});

	document.getElementById('close-window').addEventListener('click', () => {
		selectedImage.src = null;
		closeImageWindow();
	});

	window.electron.on('APP::SET_ATTACHMENT_DATA', (event, data) => {
		handleAttachmentData(data);
	});

	window.electron.on('APP::SET_CURRENT_IMAGE', (event, data) => {
		selectedImage.src = data.url;
	});

	window.electron.on('APP::CHANGE_ATTACHMENT_LIST', () => {
		window.electron.send('APP::GET_ATTACHMENT_DATA');
	});

	window.electron.send('APP::GET_ATTACHMENT_DATA');
});
