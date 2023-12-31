const DEG2RAD = Math.PI / 180;

function Point3D(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;

  this.tx = 0;
  this.ty = 0;
  this.tz = 0;

  this.project = function (cx, cy, fov, viewDistance) {
    let factor, x, y;
    factor = fov / (viewDistance + this.tz);
    x = this.tx * factor + cx;
    y = this.ty * factor + cy;
    return new Point3D(x, y, this.tz);
  };
}

function Camera(fov, zoom) {
  this.x = 0;
  this.y = 0;
  this.z = 0;
  this.cx = 0;
  this.cy = 0;
  this.cz = 0;
  this.rx = 0;
  this.ry = 0;
  this.rz = 0;
  this.fov = fov || 400;
  this.zoom = zoom || 4;
}

function Shape(vertices, faces, colors) {
  this.vertices = vertices;
  this.faces = faces;
  this.colors = colors;
  this.rx = 0;
  this.ry = 0;
  this.rz = 0;
}

Shape.prototype.rotate = function (camera) {
  const cosX = Math.cos(this.rx - camera.rx);
  const sinX = Math.sin(this.rx - camera.rx);
  const cosY = Math.cos(this.ry - camera.ry);
  const sinY = Math.sin(this.ry - camera.ry);
  const cosZ = Math.cos(this.rz - camera.rz);
  const sinZ = Math.sin(this.rz - camera.rz);

  for (let i = 0, l = this.vertices.length; i < l; i++) {
    const vertex = this.vertices[i];

    const dx = vertex.x - camera.x;
    const dy = vertex.y - camera.y;
    const dz = vertex.z - camera.z;

    const d1x = cosY * dx + sinY * dz;
    const d1y = dy;
    const d1z = cosY * dz - sinY * dx;

    const d2x = d1x;
    const d2y = cosX * d1y - sinX * d1z;
    const d2z = cosX * d1z + sinX * d1y;

    const d3x = cosZ * d2x + sinZ * d2y;
    const d3y = cosZ * d2y - sinZ * d2x;
    const d3z = d2z;

    vertex.tx = d3x - camera.x;
    vertex.ty = d3y - camera.y;
    vertex.tz = d3z - camera.z;
  }
};

Shape.prototype.transform = function (camera) {
  this.rotate(camera);
  return this.vertices.map(function (vertex) {
    return vertex.project(camera.cx, camera.cy, camera.fov, camera.zoom);
  }, this);
};

Shape.prototype.sort = function (t) {
  return this.faces
    .map(function (face, i) {
      return {
        i: i,
        z: (t[face[0]].z + t[face[1]].z + t[face[2]].z + t[face[3]].z) / 4.0,
      };
    })
    .sort(function (a, b) {
      return b.z - a.z;
    });
};

const vertices = [
  new Point3D(-1, 1, -1),
  new Point3D(1, 1, -1),
  new Point3D(1, -1, -1),
  new Point3D(-1, -1, -1),
  new Point3D(-1, 1, 1),
  new Point3D(1, 1, 1),
  new Point3D(1, -1, 1),
  new Point3D(-1, -1, 1),
];

const faces = [
  [0, 1, 2, 3],
  [1, 5, 6, 2],
  [5, 4, 7, 6],
  [4, 0, 3, 7],
  [0, 4, 5, 1],
  [3, 2, 6, 7],
];
const colors = [
  [
    Math.floor(Math.random() * (255 - 0 + 1) + 0),
    Math.floor(Math.random() * (255 - 0 + 1) + 0),
    Math.floor(Math.random() * (255 - 0 + 1) + 0),
  ],
  [
    Math.floor(Math.random() * (255 - 0 + 1) + 0),
    Math.floor(Math.random() * (255 - 0 + 1) + 0),
    Math.floor(Math.random() * (255 - 0 + 1) + 0),
  ],
  [
    Math.floor(Math.random() * (255 - 0 + 1) + 0),
    Math.floor(Math.random() * (255 - 0 + 1) + 0),
    Math.floor(Math.random() * (255 - 0 + 1) + 0),
  ],
  [0, 0, 0],
  [
    Math.floor(Math.random() * (255 - 0 + 1) + 0),
    Math.floor(Math.random() * (255 - 0 + 1) + 0),
    Math.floor(Math.random() * (255 - 0 + 1) + 0),
  ],
  [
    Math.floor(Math.random() * (255 - 0 + 1) + 0),
    Math.floor(Math.random() * (255 - 0 + 1) + 0),
    Math.floor(Math.random() * (255 - 0 + 1) + 0),
  ],
];

const camera = new Camera(500, 5);
const shape = new Shape(vertices, faces, colors);

function arrayToRGB(color, shade) {
  return (
    "rgb(" +
    parseInt(color[0] * shade) +
    "," +
    parseInt(color[1] * shade) +
    "," +
    parseInt(color[2] * shade) +
    ")"
  );
}

function init() {
  canvas = document.querySelector("canvas");
  ctx = canvas.getContext("2d");
  resize();
  setInterval(loop, 20);
}

function resize() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  camera.cx = canvas.width / 2;
  camera.cy = canvas.height / 2;
}

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const t = shape.transform(camera);
  const avg_z = shape.sort(t);

  for (let i = 0; i < faces.length; i++) {
    const index = avg_z[i].i;
    const depth = avg_z[i].z * -2;
    const face = faces[index];

    if (depth <= 0) continue;

    ctx.beginPath();
    ctx.moveTo(t[face[0]].x, t[face[0]].y);
    ctx.lineTo(t[face[1]].x, t[face[1]].y);
    ctx.lineTo(t[face[2]].x, t[face[2]].y);
    ctx.lineTo(t[face[3]].x, t[face[3]].y);
    ctx.closePath();

    ctx.fillStyle = arrayToRGB(colors[index], depth);
    ctx.fill();
  }

  shape.rx += 0.06;
  shape.ry += 0.01;
  shape.rz += 0.04;
}

init();
