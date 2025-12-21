const fileInput = document.getElementById('fileInput');
const patchInput = document.getElementById('patchInput');
const patch = document.getElementById('patch');
const patch_text = document.getElementById('Patch-Text');

const iNes1_0Header = [0x4E, 0x45, 0x53, 0x1A, 0x08, 0x10, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
const iNes2_0Header = [0x4E, 0x45, 0x53, 0x1A, 0x08, 0x10, 0x40, 0x08, 0x00, 0x00, 0x07, 0x00, 0x00, 0x00, 0x00, 0x01];
const CRC32_1_0 = "7D3F6F3D";
const CRC32_2_0 = "43507232";
const CRC32_A_1_0 = "E0CA425C";
const CRC32_A_2_0 = "DEA55F53";

const INVALID_REV = -1;

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

  romRev = get_rev(crc32HashRom);
  if (romRev == INVALID_REV) {
    text.textContent = "Invalid Smb2 ROM"
    one.style.display = 'none';
    two.style.display = 'none';
    romLoaded = false;
    patch.style.display = 'none';
    return;
  }
  text.textContent = "Valid Smb2 ROM"
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
  patchRev = get_rev(crc32BPS);
  if (patchRev == INVALID_REV) {
    patch_text.textContent = "Invalid SMB2 USA patch";
    patchLoaded = false;
    patch.style.display = 'none';
    return;
  }
  patch_text.textContent = "Valid SMB2 USA patch";
  patch_text.style.color = "green";
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

function get_rev(crc32) {
  switch (crc32) {
    case CRC32_1_0:
    case CRC32_2_0:
     return 0;
    case CRC32_A_1_0:
    case CRC32_A_2_0:
      return 1;
    default:
      return -1;
  }
}
