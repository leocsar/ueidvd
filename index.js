const HORIZONTAL_SPEED = 5;
const VERTICAL_SPEED = 3;

let boxTop = 0;
let boxLeft = 0;
let horizontalAnimationId;
let verticalAnimationId;

const boxHitsContainerOn = (direction) => {
  const containerRect = container.getBoundingClientRect();
  const boxRect = box.getBoundingClientRect();

  const boxTop = boxRect.top - containerRect.top;
  const boxLeft = boxRect.left - containerRect.left;
  const boxBottom = boxTop + boxRect.height;
  const boxRight = boxLeft + boxRect.width;

  if (direction === "top") return boxTop <= 0;
  if (direction === "bottom") return boxBottom >= containerRect.height;
  if (direction === "left") return boxLeft <= 0;
  if (direction === "right") return boxRight >= containerRect.width;
};

const moveLeft = () => {
  boxLeft -= HORIZONTAL_SPEED;
  box.style.left = boxLeft + "px";

  if (boxHitsContainerOn("left")) {
    horizontalAnimationId = requestAnimationFrame(moveRight);
    return;
  };

  horizontalAnimationId = requestAnimationFrame(moveLeft);
};

const moveRight = () => {
  boxLeft += HORIZONTAL_SPEED;
  box.style.left = boxLeft + "px";

  if (boxHitsContainerOn("right")) {
    horizontalAnimationId = requestAnimationFrame(moveLeft);
    return;
  };

  horizontalAnimationId = requestAnimationFrame(moveRight);
};

const moveUp = () => {
  boxTop -= VERTICAL_SPEED;
  box.style.top = boxTop + "px";

  if (boxHitsContainerOn("top")) {
    verticalAnimationId = requestAnimationFrame(moveDown);
    return;
  };

  verticalAnimationId = requestAnimationFrame(moveUp);
};

const moveDown = () => {
  boxTop += VERTICAL_SPEED;
  box.style.top = boxTop + "px";

  if (boxHitsContainerOn("bottom")) {
    verticalAnimationId = requestAnimationFrame(moveUp);
    return;
  };

  verticalAnimationId = requestAnimationFrame(moveDown);
};

horizontalAnimationId = requestAnimationFrame(moveRight);
verticalAnimationId = requestAnimationFrame(moveDown);
