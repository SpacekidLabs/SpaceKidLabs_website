import { writeFileSync, mkdirSync } from 'fs';

async function download() {
  try {
    const res = await fetch("https://drive.usercontent.google.com/download?id=1s4bvh0TjIdqD06miiKMQRqzKH91hzQyC&export=download");
    const buffer = await res.arrayBuffer();
    mkdirSync('public', {recursive: true});
    writeFileSync("public/samples_pack_art.png", Buffer.from(buffer));
    console.log("Downloaded image successfully.");
  } catch(e) {
    console.error(e);
  }
}
download();
