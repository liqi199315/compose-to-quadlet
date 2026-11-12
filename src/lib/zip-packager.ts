const LOCAL_FILE_HEADER_SIG = 0x04034b50;
const CENTRAL_DIR_HEADER_SIG = 0x02014b50;
const END_OF_CENTRAL_DIR_SIG = 0x06054b50;
const VERSION_NEEDED = 20;
const VERSION_MADE_BY_UNIX = (3 << 8) | VERSION_NEEDED;
const UTF8_LANGUAGE_FLAG = 0x0800;
const STORE_METHOD = 0;

const CRC32_TABLE = createCrc32Table();
const UTF8_ENCODER = new TextEncoder();

function createCrc32Table(): Uint32Array {
	const table = new Uint32Array(256);
	for (let i = 0; i < 256; i += 1) {
		let crc = i;
		for (let bit = 0; bit < 8; bit += 1) {
			crc = (crc & 1) !== 0 ? (0xedb88320 ^ (crc >>> 1)) >>> 0 : crc >>> 1;
		}
		table[i] = crc >>> 0;
	}
	return table;
}

export function computeCrc32(bytes: Uint8Array): number {
	let crc = 0xffffffff;
	for (let i = 0; i < bytes.length; i += 1) {
		const lookupIndex = (crc ^ bytes[i]!) & 0xff;
		crc = (CRC32_TABLE[lookupIndex]! ^ (crc >>> 8)) >>> 0;
	}
	return (crc ^ 0xffffffff) >>> 0;
}

function sanitizeArchiveFilename(rawName: string): string {
	const normalized = rawName
		.replace(/\\/g, '/')
		.split('/')
		.filter((segment) => segment.length > 0 && segment !== '.' && segment !== '..')
		.join('/');
	return normalized || 'unit.container';
}

function encodeDosDateTime(now: Date): { dosTime: number; dosDate: number } {
	const year = Math.min(2107, Math.max(1980, now.getFullYear()));
	const month = now.getMonth() + 1;
	const day = now.getDate();
	const hours = now.getHours();
	const minutes = now.getMinutes();
	const seconds = Math.floor(now.getSeconds() / 2);

	const dosTime = ((hours & 0x1f) << 11) | ((minutes & 0x3f) << 5) | (seconds & 0x1f);
	const dosDate = (((year - 1980) & 0x7f) << 9) | ((month & 0x0f) << 5) | (day & 0x1f);
	return { dosTime, dosDate };
}

interface PreparedEntry {
	nameBytes: Uint8Array;
	dataBytes: Uint8Array;
	crc32: number;
	externalAttrs: number;
	localHeaderOffset: number;
}

export function buildZipArchive(
	files: Array<{ filename: string; content: string }>,
): Uint8Array<ArrayBuffer> {
	const { dosTime, dosDate } = encodeDosDateTime(new Date());
	const prepared: PreparedEntry[] = [];

	let localSectionSize = 0;
	let centralDirSize = 0;

	for (const file of files) {
		const cleanName = sanitizeArchiveFilename(file.filename);
		const nameBytes = UTF8_ENCODER.encode(cleanName);
		const dataBytes = UTF8_ENCODER.encode(file.content);
		const unixMode = cleanName.endsWith('.env') ? 0o100600 : 0o100644;

		prepared.push({
			nameBytes,
			dataBytes,
			crc32: computeCrc32(dataBytes),
			externalAttrs: (unixMode << 16) >>> 0,
			localHeaderOffset: localSectionSize,
		});

		localSectionSize += 30 + nameBytes.length + dataBytes.length;
		centralDirSize += 46 + nameBytes.length;
	}

	const totalSize = localSectionSize + centralDirSize + 22;
	const buffer = new ArrayBuffer(totalSize);
	const archive = new Uint8Array(buffer);
	const view = new DataView(buffer);

	let cursor = 0;

	for (const entry of prepared) {
		view.setUint32(cursor, LOCAL_FILE_HEADER_SIG, true);
		view.setUint16(cursor + 4, VERSION_NEEDED, true);
		view.setUint16(cursor + 6, UTF8_LANGUAGE_FLAG, true);
		view.setUint16(cursor + 8, STORE_METHOD, true);
		view.setUint16(cursor + 10, dosTime, true);
		view.setUint16(cursor + 12, dosDate, true);
		view.setUint32(cursor + 14, entry.crc32, true);
		view.setUint32(cursor + 18, entry.dataBytes.length, true);
		view.setUint32(cursor + 22, entry.dataBytes.length, true);
		view.setUint16(cursor + 26, entry.nameBytes.length, true);
		view.setUint16(cursor + 28, 0, true);
		cursor += 30;

		archive.set(entry.nameBytes, cursor);
		cursor += entry.nameBytes.length;

		archive.set(entry.dataBytes, cursor);
		cursor += entry.dataBytes.length;
	}

	const centralDirOffset = cursor;

	for (const entry of prepared) {
		view.setUint32(cursor, CENTRAL_DIR_HEADER_SIG, true);
		view.setUint16(cursor + 4, VERSION_MADE_BY_UNIX, true);
		view.setUint16(cursor + 6, VERSION_NEEDED, true);
		view.setUint16(cursor + 8, UTF8_LANGUAGE_FLAG, true);
		view.setUint16(cursor + 10, STORE_METHOD, true);
		view.setUint16(cursor + 12, dosTime, true);
		view.setUint16(cursor + 14, dosDate, true);
		view.setUint32(cursor + 16, entry.crc32, true);
		view.setUint32(cursor + 20, entry.dataBytes.length, true);
		view.setUint32(cursor + 24, entry.dataBytes.length, true);
		view.setUint16(cursor + 28, entry.nameBytes.length, true);
		view.setUint16(cursor + 30, 0, true);
		view.setUint16(cursor + 32, 0, true);
		view.setUint16(cursor + 34, 0, true);
		view.setUint16(cursor + 36, 0, true);
		view.setUint32(cursor + 38, entry.externalAttrs, true);
		view.setUint32(cursor + 42, entry.localHeaderOffset, true);
		cursor += 46;

		archive.set(entry.nameBytes, cursor);
		cursor += entry.nameBytes.length;
	}

	view.setUint32(cursor, END_OF_CENTRAL_DIR_SIG, true);
	view.setUint16(cursor + 4, 0, true);
	view.setUint16(cursor + 6, 0, true);
	view.setUint16(cursor + 8, prepared.length, true);
	view.setUint16(cursor + 10, prepared.length, true);
	view.setUint32(cursor + 12, centralDirSize, true);
	view.setUint32(cursor + 16, centralDirOffset, true);
	view.setUint16(cursor + 20, 0, true);

	return archive;
}
