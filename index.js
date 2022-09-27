import { namesAndRGBValues } from "./helpers.js";

const foregroundColor = document.getElementById("foreground-color");
const backgroundColor = document.getElementById("background-color");
const foregroundSwatch = document.getElementById("swatch-one");
const backgroundSwatch = document.getElementById("swatch-two");
const ratioResult = document.getElementById("contrast-ratio-result");
const warning = document.getElementById("warning-box");
const info = document.getElementById("info-box");
const graphicsAA = document.getElementById("graphicsAA");

const hexRegex = /^#([A-Fa-f0-9]{6})$/;
const hexRegex3Digit = /^#[a-fA-F0-9]{3}$/;

const isItNamedColor = (color) => namesAndRGBValues.hasOwnProperty(color);

const shortToFullHex = (hexColor) => {
  return [...hexColor].map((x, index) => (index != 0 ? x + x : x)).join("");
};

const hexToRGB = (hexColor) => {
  const R = parseInt(hexColor.slice(1, 3), 16);
  const G = parseInt(hexColor.slice(3, 5), 16);
  const B = parseInt(hexColor.slice(5), 16);
  return [R, G, B];
};

const rgbInputToRGBNumbers = (rgbColor) => {
  const [R, G, B] = rgbColor
    .replace(/[^\d,]/g, "")
    .split(",")
    .map((RGBValue) => parseInt(RGBValue));
  return [R, G, B];
};

const hslNumbers = (hslColor) => {
  return hslColor
    .replace(/[\(\)\sA-Za-z%]/g, "")
    .split(",")
    .map((el) => Number(el));
};

const hslToRGB = (hslColor) => {
  const dataForCalculation = hslNumbers(hslColor).map((hslValue, index) => {
    return index === 0 ? hslValue : hslValue / 100;
  });
  //C = (1 - |2L - 1|) * S
  const Chroma =
    (1 - Math.abs(2 * dataForCalculation[2] - 1)) * dataForCalculation[1];
  const HuePrime = dataForCalculation[0] / 60;
  //X = C * (1 |H' mod 2 - 1|)
  const X = Chroma * (1 - Math.abs((HuePrime % 2) - 1));
  let RGBresult = [];
  if (HuePrime <= 1) {
    RGBresult = [Chroma, X, 0];
  } else if (HuePrime > 1 && HuePrime <= 2) {
    RGBresult = [X, Chroma, 0];
  } else if (HuePrime > 2 && HuePrime <= 3) {
    RGBresult = [0, Chroma, X];
  } else if (HuePrime > 3 && HuePrime <= 4) {
    RGBresult = [0, X, Chroma];
  } else if (HuePrime > 4 && HuePrime <= 5) {
    RGBresult = [X, 0, Chroma];
  } else {
    RGBresult = [Chroma, 0, X];
  }
  //m = L - (C / 2)
  const adjustLightness = dataForCalculation[2] - Chroma / 2;
  return RGBresult.map((RGBvalue) =>
    Math.round((RGBvalue + adjustLightness) * 255)
  );
};

const getLuminance = (RGBarray) => {
  //convert 8bit colors to
  //RsRGB, GsRGB BsRGB
  const XsRGBarray = RGBarray.map((elem) => elem / 255);

  const getRGBCoefficient = (XsRGB) => {
    if (XsRGB <= 0.03928) {
      return XsRGB / 12.92;
    } else {
      return Math.pow((XsRGB + 0.055) / 1.055, 2.4);
    }
  };

  //array of multipliers, for r, g, b respectively
  //L = 0.2126 * R + 0.7152 * G + 0.0722 * B
  const multipliers = [0.2126, 0.7152, 0.0722];

  let luminance = 0;

  for (let i = 0; i < multipliers.length; i++) {
    luminance += getRGBCoefficient(XsRGBarray[i]) * multipliers[i];
  }

  return luminance;
};

const calculateRatio = (color1, color2) => {
  const color1Luminance = getLuminance(color1);
  const color2Luminance = getLuminance(color2);
  /* (L1 + 0.05) / (L2 + 0.05), whereby:
    L1 is the relative luminance of the lighter of the colors, and
    L2 is the relative luminance of the darker of the colors. */
  let lighterLum = Math.max(color1Luminance, color2Luminance);
  let darkerLum = Math.min(color1Luminance, color2Luminance);
  return ((lighterLum + 0.05) / (darkerLum + 0.05)).toFixed(2);
};

const colorFormatRatio = (color1, color2, convertRatio) => {
  const RGBColor1 = convertRatio(color1);
  const RGBColor2 = convertRatio(color2);
  return calculateRatio(RGBColor1, RGBColor2);
};

const isValidRGB = (color) => {
  const rgbRegex = /^rgb\(\s?\d{1,3},\s?\d{1,3},\s?\d{1,3}\)$/i;
  if (rgbRegex.test(color)) {
    return rgbInputToRGBNumbers(color).every((v) => 0 <= v && v <= 255);
  } else return false;
};

const isValidHSL = (color) => {
  const hslRegex = /^hsl\s?\(\s?\d{1,3},\s?\d{1,3}%,\s?\d{1,3}%\)$/i;
  if (hslRegex.test(color)) {
    return hslNumbers(color).every((item, index) => {
      return index === 0 ? 0 <= item && item <= 360 : 0 <= item && item <= 100;
    });
  } else return false;
};

const isNotEmpty = (value) => {
  return value !== null && value !== "";
};

const showErrorMessage = (div) => {
  div.classList.remove(`hidden`);
};

const hideErrorMessage = (div) => {
  div.classList.add(`hidden`);
};

const clearErrors = () => {
  hideErrorMessage(warning);
  hideErrorMessage(info);
};

const updateSwatchColor = (swatch, color) => {
  if (
    hexRegex.test(color) ||
    isValidRGB(color) ||
    isValidHSL(color) ||
    hexRegex3Digit.test(color) ||
    isItNamedColor(color)
  ) {
    swatch.style.backgroundColor = color;
  }
};

const displayColor = () => {
  let firstColor = foregroundColor.value;
  let secondColor = backgroundColor.value;
  updateSwatchColor(foregroundSwatch, firstColor);
  updateSwatchColor(backgroundSwatch, secondColor);
};

const setCheck = (element, className) => {
  element.classList.add(className);
  element.innerText = element.classList.contains("pass") ? "pass" : "fail";
};

const resetCheck = (element) => {
  element.classList.remove("pass", "fail");
  element.innerText = "";
};

const displayChecks = () => {
  const ratio = parseFloat(ratioResult.innerText);
  if (!isNaN(ratio)) {
    if (ratio >= 3) {
      setCheck(graphicsAA, "pass");
    } else {
      setCheck(graphicsAA, "fail");
    }
  } else {
    resetCheck(graphicsAA);
  }
};
const setTextStatus = (element, className, text) => {
  element.classList.add(className);
  element.innerText = text
};
const handleTextStatus = () => {
  let contrastScore = ratioResult.innerText
  let checkIcon = document.querySelectorAll(".checks")
  if(contrastScore == 0) {
    checkIcon.forEach(item => resetCheck(item))
  }else{
    checkIcon.forEach(item => {
      if(contrastScore >= 3 && contrastScore < 4.5) {
        item.classList.contains("AA-large") ?
          setTextStatus(item,"pass", "Pass"): 
          setTextStatus(item,"fail", "Fail");
        }else if(contrastScore >= 4.5 && contrastScore < 7) {
        item.classList.contains("AAA-small") ?
          setTextStatus(item,"fail", "Fail"):
          setTextStatus(item,"pass", "Pass");
        }else if(contrastScore >= 7){
        setTextStatus(item,"pass", "Pass");
      }else {
        setTextStatus(item,"fail", "Fail");
      };   
      });
    };
  };

const displayRatioResult = () => {
  let firstColor = foregroundColor.value;
  let secondColor = backgroundColor.value;

  // CASE two Hexes
  if (/^#.*/.test(firstColor) && /^#.*/.test(secondColor)) {
    if (firstColor.length === 7 && secondColor.length === 7) {
      if (hexRegex.test(firstColor) && hexRegex.test(secondColor)) {
        ratioResult.innerHTML = colorFormatRatio(
          firstColor,
          secondColor,
          hexToRGB
        );
      }
    }
    if (firstColor.length >= 7 && secondColor.length >= 7) {
      if (!hexRegex.test(firstColor) || !hexRegex.test(secondColor)) {
        showErrorMessage(warning);
      }
    } else if (firstColor.length < 7 || secondColor.length < 7) {
      ratioResult.innerHTML = "";
    }
    if (hexRegex3Digit.test(firstColor) && hexRegex3Digit.test(secondColor)) {
      ratioResult.innerHTML = colorFormatRatio(
        shortToFullHex(firstColor),
        shortToFullHex(secondColor),
        hexToRGB
      );
    }
  } else if (isNotEmpty(firstColor) && isNotEmpty(secondColor)) {
    // CASE two RGBs
    if (isValidRGB(firstColor) && isValidRGB(secondColor)) {
      ratioResult.innerHTML = colorFormatRatio(
        firstColor,
        secondColor,
        rgbInputToRGBNumbers
      );
    }
    //CASE two named colors
    else if (isItNamedColor(firstColor) && isItNamedColor(secondColor)) {
      ratioResult.innerHTML = calculateRatio(
        namesAndRGBValues[firstColor],
        namesAndRGBValues[secondColor]
      );
    }
    //CASE two HSL
    else if (isValidHSL(firstColor) && isValidHSL(secondColor)) {
      ratioResult.innerHTML = colorFormatRatio(
        firstColor,
        secondColor,
        hslToRGB
      );
    } else {
      showErrorMessage(warning);
    }
  } else {
    showErrorMessage(info);
  }
};

const handleChange = () => {
  ratioResult.innerHTML = "";
  clearErrors();
  displayColor();
  resetCheck(graphicsAA);
  handleTextStatus()
};

const displayResult = () => {
  displayRatioResult();
  displayChecks();
  handleTextStatus()
};

foregroundColor.oninput = handleChange;
backgroundColor.oninput = handleChange;
foregroundColor.onblur = displayResult;
backgroundColor.onblur = displayResult;

document.querySelector("#copyright").innerText = new Date().getFullYear();
