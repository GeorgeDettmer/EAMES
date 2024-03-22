interface Part {
	id?: string;
	name: string;
	description?: string | null;
	polarised?: boolean;
}

interface BomLine {
	id?: string;
	//part: string | string[] | Part | Part[] | null;
	reference: string | null;
	quantity?: number | null;
	description?: string | null;
}

//Perhaps split this up into 3 classes: 1) XL Import data, 2) BOMImport date, 3) Final BOM data

export class BOM {
	_lines: Map<string | null, BomLine[]> = new Map();
	_references: Set<string> = new Set();
	_metadata: Map<string, string | number> = new Map();
	constructor(lines: Map<string | null, BomLine[]>, metadata: Map<string, string | number>) {
		if (lines?.size) {
			this._lines = lines;
		}
		if (metadata?.size) {
			this._metadata = metadata;
		}
		this._references = new Set([...this._lines.keys()]?.filter((k) => !!k) as string[]);
	}

	//To return a new map: Map<part,[{reference,quantity,description,...}]
	get lines() {
		return this._lines;
	}
	set lines(lines: Map<string | null, BomLine[]>) {
		this._lines = lines;
	}

	//To return a new map: Map<reference,{part,...}
	get linesByRef() {
		let linesByRef: Map<string, BomLine> = new Map();

		this._lines.forEach(l, (pn) => {
			linesByRef.set(l?.reference, { pn, ...l });
		});

		return linesByRef;
	}

	setLinesFromSheetJSON(json: any[][]) {
		for (let i = headerRow + 1; i < json.length; i++) {
			let line = json[i];
			lines.push(
				new Map(
					json[headerRow].map((key, j) => [
						{
							name: key?.toLowerCase(),
							cell: XLSX.utils.encode_cell({ c: j, r: i }),
							col: XLSX.utils.encode_col(j),
							row: Number(XLSX.utils.encode_row(i))
						},
						line[j]
					])
				)
			);
		}
		console.log(lines);
		console.log('headers', json[headerRow]);
	}
}
