{
	const body = document.body;

	// helper functions
	const MathUtils = {
		lerp: (a, b, n) => (1 - n) * a + n * b,
		distance: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
	};

	// get the mouse position
	const getMousePos = (ev) => {
		let posx = 0;
		let posy = 0;
		if (!ev) ev = window.event;
		if (ev.pageX || ev.pageY) {
			posx = ev.pageX;
			posy = ev.pageY;
		} else if (ev.clientX || ev.clientY) {
			posx = ev.clientX + body.scrollLeft + docEl.scrollLeft;
			posy = ev.clientY + body.scrollTop + docEl.scrollTop;
		}
		return { x: posx, y: posy };
	};

	let mousePos = (lastMousePos = cacheMousePos = { x: 0, y: 0 });

	// update the mouse position
	window.addEventListener("mousemove", (ev) => (mousePos = getMousePos(ev)));

	const getMouseDistance = () =>
		MathUtils.distance(mousePos.x, mousePos.y, lastMousePos.x, lastMousePos.y);

	class Image {
		constructor(el) {
			this.DOM = { el: el };
			this.defaultStyle = {
				scale: 1,
				x: 0,
				y: 0,
				opacity: 0,
			};
			this.getRect();
		}

		getRect() {
			this.rect = this.DOM.el.getBoundingClientRect();
		}
		isActive() {
			return TweenMax.isTweening(this.DOM.el) || this.DOM.el.style.opacity != 0;
		}
	}

	class ImageTrail {
		constructor() {
			this.DOM = { content: document.querySelector(".content") };
			this.images = [];
			[...this.DOM.content.querySelectorAll("img")].forEach((img) =>
				this.images.push(new Image(img))
			);
			this.imagesTotal = this.images.length;
			this.imgPosition = 0;
			this.zIndexVal = 1;
			this.threshold = 100;
			requestAnimationFrame(() => this.render());
		}
		render() {
			let distance = getMouseDistance();
			cacheMousePos.x = MathUtils.lerp(
				cacheMousePos.x || mousePos.x,
				mousePos.x,
				0.1
			);
			cacheMousePos.y = MathUtils.lerp(
				cacheMousePos.y || mousePos.y,
				mousePos.y,
				0.1
			);

			if (distance > this.threshold) {
				this.showNextImage();

				++this.zIndexVal;
				this.imgPosition =
					this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0;

				lastMousePos = mousePos;
			}

			let isIdle = true;
			for (let img of this.images) {
				if (img.isActive()) {
					isIdle = false;
					break;
				}
			}
			if (isIdle && this.zIndexVal !== 1) {
				this.zIndexVal = 1;
			}

			requestAnimationFrame(() => this.render());
		}
		showNextImage() {
			const img = this.images[this.imgPosition];
			TweenMax.killTweensOf(img.DOM.el);

			new TimelineMax()
				.set(
					img.DOM.el,
					{
						startAt: { opacity: 0, scale: 1 },
						opacity: 1,
						scale: 1,
						zIndex: this.zIndexVal,
						x: cacheMousePos.x - img.rect.width / 2,
						y: cacheMousePos.y - img.rect.height / 2,
					},
					0
				)
				.to(
					img.DOM.el,
					0.9,
					{
						ease: Expo.easeOut,
						x: mousePos.x - img.rect.width / 2,
						y: mousePos.y - img.rect.height / 2,
					},
					0
				)
				.to(
					img.DOM.el,
					1,
					{
						ease: Power1.easeOut,
						opacity: 0,
					},
					0.4
				)
				.to(
					img.DOM.el,
					1,
					{
						ease: Quint.easeOut,
						scale: 0.2,
					},
					0.4
				);
		}
	}

	// preload images
	const preloadImages = () => {
		return new Promise((resolve, reject) => {
			imagesLoaded(document.querySelectorAll(".content__img"), resolve);
		});
	};

	preloadImages().then(() => {
		new ImageTrail();
	});
}
