import * as _bpac from '$lib/utils/bpac/_bpac';
import { messagesStore } from 'svelte-legos';

export function extensionInstalled(showWarning: boolean = true): boolean {
	const extensionIsInstalled = _bpac.IsExtensionInstalled() != false;
	if (!extensionIsInstalled) {
		messagesStore("Brother 'bpac' browser extension is not installed!", 'error');
		/* const agent = window.navigator.userAgent.toLowerCase();
		const isedge = agent.indexOf('edg') !== -1;
		if (isedge)
			window.open(
				'https://microsoftedge.microsoft.com/addons/detail/brother-bpac-extension/kmopihekhjobijiipnloimfdgjddbnhg',
				'_blank'
			);
		const ischrome = agent.indexOf('chrome') !== -1 && agent.indexOf('opr') === -1;
		if (ischrome) window.open('https://chrome.google.com/webstore/detail/ilpghlfadkjifilabejhhijpfphfcfhb', '_blank'); */
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
		if (ret == true) {
			content.forEach(async ({ name, type, content }, idx) => {
				if (type === 'text') {
					(await objDoc.GetObject(name)).Text = content ? String(content) : '';
				} else if (type === 'barcode') {
					objDoc.SetBarcodeData(await objDoc.GetBarcodeIndex(name), content ? String(content) : '');
				} else {
					console.error('BPAC UNHANDLED CONTENT TYPE', { name, content, type });
				}
			});

			/* //const text = await objDoc.GetObject('text');
			//text.Text = 'wow';
			(await objDoc.GetObject('text')).Text = 'wowow';
			//const barcode = await objDoc.GetObject('barcode');
			//await barcode.SetBarcodeData(barcode, 'new barcode test wow');
			await objDoc.SetBarcodeData(await objDoc.GetBarcodeIndex('barcode'), 'new barcode test wow');
			console.log('bpac width:', await objDoc.Width); */

			await objDoc.StartPrint('', 0);
			await objDoc.PrintOut(1, 0);
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
	return await _bpac.IPrinter.GetInstalledPrinters();
}

export async function printerOnline(printer: string): Promise<boolean> {
	return await _bpac.IPrinter.IsPrinterOnline(printer);
}

interface PrinterDetails {
	mediaId: number;
	mediaName: string;
}
export async function printerDetails(printer: string): Promise<PrinterDetails> {
	let details = {
		mediaId: await _bpac.IPrinter.GetMediaId(),
		mediaName: await _bpac.IPrinter.GetMediaName(),
		supportedMediaIds: await _bpac.IPrinter.GetSupportedMediaIds(),
		supportedMediaNames: await _bpac.IPrinter.GetSupportedMediaNames()
	};
	return details;
}
