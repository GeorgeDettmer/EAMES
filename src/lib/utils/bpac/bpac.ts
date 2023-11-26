import * as _bpac from '$lib/utils/bpac/_bpac';
import { messagesStore } from 'svelte-legos';

export function extensionInstalled(showWarning: boolean = true): boolean {
	const extensionIsInstalled = _bpac.IsExtensionInstalled() != false;
	if (!extensionIsInstalled) {
		let messageShown = JSON.parse(String(localStorage.getItem('EAMES_bpacExtensionNotificationShown')));
		if (!messageShown && !showWarning) {
			messagesStore("Brother 'bpac' browser extension is not installed!", 'error');
			localStorage.setItem('EAMES_bpacExtensionNotificationShown', 'true');
			const agent = window.navigator.userAgent.toLowerCase();
			const isedge = agent.indexOf('edg') !== -1;
			if (isedge)
				window.open(
					'https://microsoftedge.microsoft.com/addons/detail/brother-bpac-extension/kmopihekhjobijiipnloimfdgjddbnhg',
					'_blank'
				);
			const ischrome = agent.indexOf('chrome') !== -1 && agent.indexOf('opr') === -1;
			if (ischrome) window.open('https://chrome.google.com/webstore/detail/ilpghlfadkjifilabejhhijpfphfcfhb', '_blank');
		}
	}
	return extensionIsInstalled;
}

export interface LabelContent {
	name: string;
	type: 'text' | 'barcode';
	content: string;
}
export async function printLabel(templatePath: string, content: LabelContent[]): Promise<boolean> {
	if (!extensionInstalled()) return false;

	try {
		const objDoc = _bpac.IDocument;
		const ret = await objDoc.Open(templatePath);
		console.log('bpac', ret);
		if (ret === true) {
			for (const c of content) {
				const { name, type, content } = c;
				console.log('BPAC SET CONTENT', c);
				let object = await objDoc.GetObject(name);
				if (object === false) {
					console.error('BPAC ERROR OBJECT NOT FOUND', c);
				} else {
					if (type === 'text') {
						//object.Text = content;
						(await objDoc.GetObject(name)).Text = String(content);
					} else if (type === 'barcode') {
						await objDoc.SetBarcodeData(await objDoc.GetBarcodeIndex(name), content);
					} else {
						console.error('BPAC UNHANDLED CONTENT TYPE', c);
					}
				}
			}

			//const text = await objDoc.GetObject('text');
			//text.Text = 'wow';
			//(await objDoc.GetObject('pn')).Text = 'wowow';
			//const barcode = await objDoc.GetObject('barcode');
			//await barcode.SetBarcodeData(barcode, 'new barcode test wow');
			//await objDoc.SetBarcodeData(await objDoc.GetBarcodeIndex('barcode_pn'), 'new barcode test wow');
			//console.log('bpac width:', await objDoc.Width);

			if ((await objDoc.StartPrint('', 65536 + 1)) === false) {
				console.error('BPAC ERROR', objDoc.ErrorCode);
				return false;
			} //33554432 = hi res
			if ((await objDoc.PrintOut(1, 65536 + 1)) === false) {
				console.error('BPAC ERROR', objDoc.ErrorCode);
				return false;
			}
			await objDoc.EndPrint();
			await objDoc.Close();
			return true;
		} else {
			return false;
		}
	} catch (e) {
		console.error('BPAC ERROR:', e);
		return false;
	}
}

export async function getPrinters(): Promise<string[]> {
	if (!extensionInstalled()) return [];
	return await _bpac.IPrinter.GetInstalledPrinters();
}

export async function printerOnline(printer: string | undefined = undefined): Promise<boolean> {
	if (!printer) {
		let printers = await getPrinters();
		printer = printers?.[0];
	}
	if (!printer) {
		return false;
	}
	return await _bpac.IPrinter.IsPrinterOnline(printer);
}

interface PrinterDetails {
	printer: string;
	mediaId: number;
	mediaName: string;
	supportedMediaIds: number[];
	supportedMediaNames: string[];
}
export async function printerDetails(printer: string): Promise<PrinterDetails> {
	let details = {
		printer,
		mediaId: await _bpac.IPrinter.GetMediaId(),
		mediaName: await _bpac.IPrinter.GetMediaName(),
		supportedMediaIds: await _bpac.IPrinter.GetSupportedMediaIds(),
		supportedMediaNames: await _bpac.IPrinter.GetSupportedMediaNames()
	};
	return details;
}
