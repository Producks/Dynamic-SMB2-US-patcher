const fileInput = document.getElementById('fileInput');
const patchInput = document.getElementById('patchInput');
const patch = document.getElementById('patch');

const iNes1_0Header = [0x4E, 0x45, 0x53, 0x1A, 0x08, 0x10, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
const iNes2_0Header = [0x4E, 0x45, 0x53, 0x1A, 0x08, 0x10, 0x40, 0x08, 0x00, 0x00, 0x07, 0x00, 0x00, 0x00, 0x00, 0x01];
const CRC32_1_0 = "7D3F6F3D";
const CRC32_2_0 = "43507232";
const CRC32_A_1_0 = "E0CA425C";
const CRC32_A_2_0 = "DEA55F53";

var romFile;
var crc32HashRom;
var romRev;
var romLoaded = false;

var bpsPatch;
var crc32BPS;
var patchRev;
var patchLoaded = false;

fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file)
    return;
  romFile = new BinFile(await file.arrayBuffer());
  crc32HashRom = romFile.hashCRC32().toString(16).padStart(8, "0").toUpperCase();

  switch (crc32HashRom) {
    case CRC32_1_0:
      text.textContent = "iNES 1.0 rom loaded";
      romRev = 0;
      break;
    case CRC32_2_0:
      text.textContent = "iNES 2.0 rom loaded";
      romRev = 0;
      break;
    case CRC32_A_1_0:
      text.textContent = "iNES 1.0 Rev A rom loaded";
      romRev = 1;
      break;
    case CRC32_A_2_0:
      text.textContent = "iNES 2.0 Rev A rom loaded";
      romRev = 1;
      break;
    default:
      text.textContent = "Invalid Smb2 ROM"
      one.style.display = 'none';
      two.style.display = 'none';
      romLoaded = false;
      patch.style.display = 'none';
      return;
  }
  romLoaded = true;
  if (patchLoaded && romLoaded)
    patch.style.display = 'block';
});

patchInput.addEventListener('change', async () => {
  const file = patchInput.files[0];
  if (!file)
    return;
  try {
    const bpsFile = new BinFile(await file.arrayBuffer());
    bpsPatch = BPS.fromFile(bpsFile);
    crc32BPS = bpsPatch.sourceChecksum.toString(16).toUpperCase().padStart(8, '0');
    console.log(crc32BPS);
  } catch (e) {
    console.log(e);
  }
  switch (crc32BPS) {
    case CRC32_1_0:
    case CRC32_2_0:
      patchRev = 0;
      break;
    case CRC32_A_1_0:
      patchRev = 1;
      break;
    default:
      patchText.textContent = "Invalid SMB2 USA patch";
      patchLoaded = false;
      patch.style.display = 'none';
      return;
  }
  patchLoaded = true;
  if (patchLoaded && romLoaded)
    patch.style.display = 'block';
});

patch.addEventListener('click',  async() => {
  await validate_rom();
  bpsPatch.apply(romFile).save();
});

async function validate_rom() {
  if (crc32HashRom == crc32BPS)
    return;
  romFile.swapHeader(iNes1_0Header);
  if (patchRev != romRev)
    await swap_rev();
  if (crc32HashRom != crc32BPS)
    romFile.swapHeader(iNes2_0Header);
}

async function swap_rev() {
  const patch = await fetchPatch(romRev ? "./rev_0.bps" : "rev_a.bps");
  romFile = patch.apply(romFile);
  romRev = romRev ^ 1;
  crc32HashRom = romFile.hashCRC32().toString(16).padStart(8, "0").toUpperCase();
}

async function fetchPatch(patch_path) {
  const fetched_patch = await fetch(patch_path);
  return BPS.fromFile(new BinFile(await fetched_patch.arrayBuffer()));
}
