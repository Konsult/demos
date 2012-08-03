function normalizeDegrees (angle) {
    if (angle < 0)
      angle = angle + (Math.ceil(angle / 360) + 1) * 360;
    return angle % 360;
}

function smallestDeltaInDegrees(deg1, deg2) {
  deg1 = normalizeDegrees(deg1);
  deg2 = normalizeDegrees(deg2);

  var diff = deg2 - deg1;
  if (Math.abs(diff) < 180)
    return diff;
  if (diff > 0)
    return -(360 - diff);
  else
    return 360 + diff;
}

function degreesFromUp(x1, y1, x2, y2) {
    return ((Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI) + 450) % 360;
}