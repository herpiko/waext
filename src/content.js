const config = require('./config');

var data = [];

const addLabelToEl = (contactName, label, el) => {
	let labelEl = document.createElement('span');
	labelEl.setAttribute(
		'style',
		'background-color: #0a80ca;color: white;padding-left: 5px;padding-right: 5px;padding-top: 2px;padding-bottom: 3px;border-radius: 5px;margin-right:5px;'
	);
	labelEl.addEventListener('click', function () {
		console.log('Add label for ' + contactName);
		let confirmed = window.confirm(
			'Are you sure that you want to remove ' + label + ' from ' + contactName
		);
		if (confirmed) {
			remove(contactName, label, apply);
		}
	});
	labelEl.appendChild(document.createTextNode(label));
	el.appendChild(labelEl);
};

const init = () => {
	let interval = setInterval(() => {
		const els = document.querySelectorAll(
			'div[data-testid="cell-frame-container"]'
		);
		console.log(els.length);
		if (els.length > 2) {
			clearInterval(interval);
			applySearchFeature();
			apply();
			/* Rerender on scroll
			setInterval(() => {
				console.log('===========================');
				apply();
			}, 1000);
			 */
		}
	}, 1000);
};

const fetch = (cb) => {
	chrome.storage.sync.get(['data'], function (result) {
		if (result && result.data) {
			try {
				data = JSON.parse(result.data);
			} catch (e) {
				console.log(e);
			}
		}
		const els = document.querySelectorAll(
			'div[data-testid="cell-frame-container"]'
		);
		for (let i in els) {
			try {
				let contactEl = els[i];
				if (
					!(
						contactEl.childNodes &&
						contactEl.childNodes[1] &&
						contactEl.childNodes[1].childNodes[0] &&
						contactEl.childNodes[1].childNodes[0].childNodes[0] &&
						contactEl.childNodes[1].childNodes[0].childNodes[0].childNodes[0]
							.title
					)
				) {
					continue;
				}
				let contactName =
					contactEl.childNodes[1].childNodes[0].childNodes[0].childNodes[0]
						.title;
				let found = false;
				for (let i in data) {
					if (data[i].contactName === contactName) {
						found = true;
					}
				}
				if (!found) {
					data.push({ contactName: contactName });
				}
			} catch (e) {
				console.log(e);
			}
		}
		cb(data);
	});
};

const update = (contactName, label, cb) => {
	console.log('Update label');
	fetch((currentData) => {
		for (let i in currentData) {
			if (currentData[i].contactName === contactName) {
				currentData[i].labels = currentData[i].labels || [];
				currentData[i].labels.push(label);
			}
		}

		// Save
		chrome.storage.sync.set({ data: JSON.stringify(currentData)}, function () {
		  data = currentData;
			cb();
		});
	});
};

const remove = (contactName, label, cb) => {
	console.log('Remove label');
	fetch((currentData) => {
		for (let i in currentData) {
			if (currentData[i].contactName === contactName) {
				currentData[i].labels = currentData[i].labels || [];
				for (let j in currentData[i].labels) {
					if (currentData[i].labels[j] === label) {
						currentData[i].labels.splice(j, 1);
					}
				}
			}
		}

		// Save
		chrome.storage.sync.set({ data: JSON.stringify(currentData)}, function () {
		  data = currentData;
			cb();
		});
	});
};

const applySearchFeature = () => {
	// Remove existing element
	const searchElements = document.getElementsByClassName('waext-search');
	while (searchElements.length > 0) {
		searchElements[0].parentNode.removeChild(searchElements[0]);
	}

	// Apply search feature
	let waSearchEl = document.querySelectorAll(
		'div[data-testid="chat-list-search-container"]'
	)[0];
	let waextSearchEl = document.createElement('div');
	waextSearchEl.setAttribute('class', 'waext-search');
	waextSearchEl.setAttribute('style', 'background-color:#0a80ca;height:47px;text-align:center;padding:5px;');
	let waextSearchInputEl = document.createElement('input');
	waextSearchInputEl.setAttribute(
		'style',
		'width: 89%;height: 31px;margin-top: 7px;border-radius: 7px;border: 0px;padding-left: 15px;'
	);
	waextSearchEl.appendChild(waextSearchInputEl);
	waextSearchInputEl.setAttribute('placeholder', 'Search by label');
	waextSearchInputEl.addEventListener('input', function (value) {
		// Remove existing element
		const elements = document.getElementsByClassName('waext-search-result');
		while (elements.length > 0) {
			elements[0].parentNode.removeChild(elements[0]);
		}
		if (
			value &&
			value.target &&
			value.target.value &&
			value.target.value.length > 0
		) {
			let searchString = value.target.value;
			fetch((currentData) => {
				let filtered = [];
				for (let i in currentData) {
					currentData[i].labels = currentData[i].labels || [];
					for (let j in currentData[i].labels) {
						if (
							currentData[i].labels[j]
								.toLowerCase()
								.includes(searchString.toLowerCase())
						) {
							currentData[i].matchedLabel = currentData[i].labels[j];
							filtered.push(currentData[i]);
						}
					}
				}
				if (filtered.length === 0) {
					// Remove existing element
					const elements = document.getElementsByClassName(
						'waext-search-result'
					);
					while (elements.length > 0) {
						elements[0].parentNode.removeChild(elements[0]);
					}
					return;
				}

				// Append the result
				let prev = null;
				for (let i in filtered) {
					let div = document.createElement('div');
					div.setAttribute(
						'style',
						'background-color: #afdafd;cursor: pointer;height: 40px;padding-top: 20px;padding-left: 15px;border-bottom:1px solid #0a80ca'
					);
					div.setAttribute(
						'class',
						'waext-search-result waext-search-result-item'
					);
					div.appendChild(
						document.createTextNode(
							filtered[i].contactName + ' - ' + filtered[i].matchedLabel
						)
					);
					div.addEventListener('click', function () {
						navigator.clipboard.writeText(filtered[i].contactName);
						// Remove existing element
						const elements = document.getElementsByClassName(
							'waext-search-result'
						);
						while (elements.length > 0) {
							elements[0].parentNode.removeChild(elements[0]);
						}
						waextSearchInputEl.value = '';
					});
					waextSearchEl.parentNode.insertBefore(div, waextSearchEl.nextSibling);
				}

				let waextSearchResultGuideEl = document.createElement('div');
				waextSearchResultGuideEl.appendChild(
					document.createTextNode(
						'Click the item below to copy the contact name'
					)
				);
				waextSearchResultGuideEl.setAttribute('class', 'waext-search-result');
				waextSearchResultGuideEl.setAttribute(
					'style',
					'background-color: #0a80ca;color: white;font-size: small;text-align: center;padding-bottom: 10px;padding-top:5px;'
				);
				waextSearchEl.parentNode.insertBefore(
					waextSearchResultGuideEl,
					waextSearchEl.nextSibling
				);
			});
		} else {
			// Remove existing element
			const elements = document.getElementsByClassName('waext-search-result');
			while (elements.length > 0) {
				elements[0].parentNode.removeChild(elements[0]);
			}
		}
	});
	waSearchEl.parentNode.insertBefore(waextSearchEl, waSearchEl.nextSibling);
};

const apply = () => {
	console.log('Get the current data');
	fetch((currentData) => {
		// Remove existing element
		const elements = document.getElementsByClassName('waext-label');
		while (elements.length > 0) {
			elements[0].parentNode.removeChild(elements[0]);
		}

		console.log('Apply the label');
		const els = document.querySelectorAll(
			'div[data-testid="cell-frame-container"]'
		);

		for (let i in els) {
			try {
				let contactEl = els[i];
				if (
					!(
						contactEl.childNodes &&
						contactEl.childNodes[1] &&
						contactEl.childNodes[1].childNodes[0] &&
						contactEl.childNodes[1].childNodes[0].childNodes[0] &&
						contactEl.childNodes[1].childNodes[0].childNodes[0].childNodes[0]
							.title
					)
				) {
					continue;
				}
				let contactName =
					contactEl.childNodes[1].childNodes[0].childNodes[0].childNodes[0]
						.title;
				let contactTextEl = contactEl.childNodes[1];
				let div = document.createElement('div');
				div.setAttribute('class', 'waext-label');
				div.setAttribute('style', 'margin-top:5px;');
				let addButton = document.createElement('span');
				addButton.setAttribute(
					'style',
					'background-color: #0a80ca;color: white;padding-left: 5px;padding-right: 5px;padding-top: 2px;padding-bottom: 3px;border-radius: 5px;'
				);
				addButton.addEventListener('click', function () {
					console.log('Add label for ' + contactName);
					let labelName = window.prompt('Add label for ' + contactName);
					if (labelName && labelName.length > 0) {
						update(contactName, labelName, apply);
					}
				});
				addButton.appendChild(document.createTextNode('+'));

				// Add existing label
				for (let i in currentData) {
					if (
						currentData[i].contactName === contactName &&
						currentData[i].labels
					) {
						let labels = currentData[i].labels;
						labels.sort();
						for (let j in labels) {
							addLabelToEl(contactName, labels[j], div);
						}
					}
				}

				// Add addLabel button
				div.appendChild(addButton);
				contactTextEl.appendChild(div);
			} catch (e) {
				console.log(e);
			}
		}
	});
};

// Internal listener
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	console.log(request);
	console.log(sender);
	console.log(sendResponse);
	sendResponse({ response: 'yo' });
	if (false) {
		chrome.runtime.sendMessage({
			action: 'getKeyList',
		});
	}
});

init();
console.log('waext content.js');
