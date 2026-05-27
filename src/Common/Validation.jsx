import { defaultCountries, parseCountry } from 'react-international-phone';

const nameRegex = /^[a-zA-Z]+(?: [a-zA-Z]+)*$/;
const descriptionRegex = /^(?!\s*$).+/;
const emailRegex =
  /^(?=[a-zA-Z0-9._-]{6,30}@)(?=[a-zA-Z0-9._-]*[a-zA-Z])[a-zA-Z0-9]+([._-]?[a-zA-Z0-9]+)*@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
const mobileRegex = /^[0-9]+$/;
const domainRegex =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+(?:[a-zA-Z]{2,})$/;
const urlRegex = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(:\d+)?(\/[^\s]*)?$/i;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
import dayjs from 'dayjs';
import moment from 'moment';

export const nameValidator = name => {
  let error = '';

  if (!name || name.length <= 0) error = ' is required';
  else if (!nameRegex.test(name) || name.length < 3) error = ' is not valid';

  return error;
};

export const lastNameValidator = name => {
  let error = '';

  if (!name || name.length <= 0) error = ' is required';
  else if (!nameRegex.test(name)) error = ' is not valid';

  return error;
};

export const descriptionValidator = name => {
  let error = '';
  const trimmedName = name.trim();

  if (!trimmedName || trimmedName.length <= 0) error = ' is required';
  else if (!descriptionRegex.test(trimmedName) || trimmedName.length < 2)
    error = ' must be 2 characters';

  return error;
};

export const emailValidator = email => {
  let error = '';

  if (!email || email.length <= 0) error = ' is required';
  else if (!emailRegex.test(email)) error = ' is not valid';

  return error;
};

export const userIdValidator = userid => {
  let error = '';

  if (!userid || userid.length <= 0) error = ' is required';
  else if (!mobileRegex.test(userid) || userid.length < 4)
    error = ' is not valid';
  return error;
};

export const passwordValidator = password => {
  const isTooShort = password.length < 8;
  const isMissingLowercase = !/[a-z]/.test(password);
  const isMissingUppercase = !/[A-Z]/.test(password);
  const isMissingNumber = !/\d/.test(password);
  const isMissingSpecialChar = !/[\W_]/.test(password);

  let error = '';

  const newErrors = {
    lengthError: isTooShort ? ' must be at least 8 characters long.' : '',
    lowercaseError: isMissingLowercase
      ? ' must contain at least one lowercase letter.'
      : '',
    uppercaseError: isMissingUppercase
      ? ' must contain at least one uppercase letter.'
      : '',
    numberError: isMissingNumber ? ' must contain at least one numeric.' : '',
    specialCharacterError: isMissingSpecialChar
      ? ' must contain at least one special character (!@#$%^&* etc.).'
      : '',
  };

  if (newErrors.lengthError) {
    error = newErrors.lengthError;
  } else if (newErrors.lowercaseError) {
    error = newErrors.lowercaseError;
  } else if (newErrors.uppercaseError) {
    error = newErrors.uppercaseError;
  } else if (newErrors.numberError) {
    error = newErrors.numberError;
  } else if (newErrors.specialCharacterError) {
    error = newErrors.specialCharacterError;
  }
  return error;
};

export const selectValidator = name => {
  let error = '';

  if (!name || name.length <= 0) error = ' is required';

  return error;
};

const countryLengthFallback = {
  // GCC / Middle East
  kw: 8, // Kuwait
  sa: 9, // Saudi Arabia
  ae: 9, // UAE
  qa: 8, // Qatar
  bh: 8, // Bahrain
  om: 8, // Oman
  eg: 10, // Egypt
  ye: 9, // Yemen
  jo: 9, // Jordan
  lb: [7, 8], // Lebanon
  iq: 10, // Iraq
  sy: 9, // Syria
  ps: 9, // Palestine

  // South / Southeast Asia
  bd: 10, // Bangladesh
  np: 10, // Nepal
  lk: 9, // Sri Lanka
  mv: 7, // Maldives
  pk: 10, // Pakistan
  my: [9, 10], // Malaysia
  sg: 8, // Singapore
  id: [9, 10, 11, 12], // Indonesia
  th: 9, // Thailand
  vn: 9, // Vietnam
  kh: [8, 9], // Cambodia
  mm: 9, // Myanmar
  la: [8, 9], // Laos
  bn: 7, // Brunei
  ph: 10, // Philippines

  // Europe (commonly missing)
  at: [10, 11], // Austria
  bg: [8, 9], // Bulgaria
  hr: 9, // Croatia
  hu: 9, // Hungary
  lt: 8, // Lithuania
  lu: 9, // Luxembourg
  mc: [8, 9], // Monaco
  me: 8, // Montenegro
  pt: 9, // Portugal
  ro: 9, // Romania
  sm: [8, 9, 10], // San Marino
  rs: 9, // Serbia
  sk: 9, // Slovakia
  si: 8, // Slovenia

  // Americas (commonly missing)
  cl: 9, // Chile
  ec: 9, // Ecuador
  ve: 10, // Venezuela
  py: 9, // Paraguay
  pe: 9, // Peru
  uy: 8, // Uruguay
  ni: 8, // Nicaragua
  pa: 8, // Panama
  hn: 8, // Honduras
  jm: 7, // Jamaica
  bs: 7, // Bahamas
  bb: 7, // Barbados
  bz: 7, // Belize
  dm: 7, // Dominica
  gd: 7, // Grenada
  kn: 7, // Saint Kitts
  lc: 7, // Saint Lucia
  vc: 7, // Saint Vincent
  tt: 7, // Trinidad
  ag: 7, // Antigua
  aw: 7, // Aruba
  cw: 7, // Curacao
  bq: 7, // Caribbean Netherlands

  // Africa (commonly missing)
  dz: 9, // Algeria
  ao: 9, // Angola
  bj: 8, // Benin
  bw: [7, 8], // Botswana
  bf: 8, // Burkina Faso
  bi: 8, // Burundi
  cm: 9, // Cameroon
  cv: 7, // Cape Verde
  cf: 8, // Central African Rep
  td: 8, // Chad
  km: 7, // Comoros
  cd: 9, // Dem. Rep. Congo
  cg: 9, // Rep. Congo
  gq: 9, // Equatorial Guinea
  er: 7, // Eritrea
  ga: 8, // Gabon
  gm: 7, // Gambia
  gh: 9, // Ghana
  gn: 9, // Guinea
  gw: 7, // Guinea-Bissau
  ke: 9, // Kenya
  ls: 8, // Lesotho
  lr: [7, 8], // Liberia
  ly: 9, // Libya
  mg: 9, // Madagascar
  mw: 9, // Malawi
  ml: 8, // Mali
  mr: 8, // Mauritania
  mu: [7, 8], // Mauritius
  mz: 9, // Mozambique
  na: 9, // Namibia
  ne: 8, // Niger
  ng: 10, // Nigeria
  rw: 9, // Rwanda
  sn: 9, // Senegal
  sc: 7, // Seychelles
  sl: 8, // Sierra Leone
  so: [8, 9], // Somalia
  za: 9, // South Africa
  ss: 9, // South Sudan
  sd: 9, // Sudan
  sz: 8, // Swaziland
  tg: 8, // Togo
  tn: 8, // Tunisia
  ug: 9, // Uganda
  zm: 9, // Zambia
  zw: 9, // Zimbabwe

  // Oceania (commonly missing)
  fj: 7, // Fiji
  ki: 8, // Kiribati
  mh: 7, // Marshall Islands
  fm: 7, // Micronesia
  nr: 7, // Nauru
  nc: 6, // New Caledonia
  pw: 7, // Palau
  pg: 8, // Papua New Guinea
  ws: 7, // Samoa
  sb: 7, // Solomon Islands
  to: 7, // Tonga
  tv: [5, 6], // Tuvalu
  vu: 7, // Vanuatu

  // Others
  af: 9, // Afghanistan
  al: 9, // Albania
  ad: 6, // Andorra
  bt: 8, // Bhutan
  bo: 8, // Bolivia
  ba: 8, // Bosnia
  bn: 7, // Brunei
  cu: 8, // Cuba
  ge: 9, // Georgia
  xk: 8, // Kosovo
  mo: 8, // Macau
  mk: 8, // Macedonia
  mn: 8, // Mongolia
  tj: 9, // Tajikistan
  tm: 8, // Turkmenistan
};

export const getExpectedPhoneLength = (countryCode, mobileNumber = '') => {
  if (!countryCode) return null;
  const iso = countryCode.toLowerCase();
  const countryObj = defaultCountries.find(c => parseCountry(c).iso2 === iso);
  if (!countryObj) return null;

  const parsed = parseCountry(countryObj);
  if (parsed.format) {
    let formatStr = '';
    if (typeof parsed.format === 'string') {
      formatStr = parsed.format;
    } else if (typeof parsed.format === 'object') {
      const keys = Object.keys(parsed.format).filter(k => k !== 'default');
      let matchedKey = null;
      for (const key of keys) {
        try {
          const pattern = key.replace(/^\/|\/$/g, '');
          const regex = new RegExp(pattern);
          if (regex.test(mobileNumber)) {
            matchedKey = key;
            break;
          }
        } catch (e) {
          // ignore invalid regex
        }
      }
      formatStr = matchedKey
        ? parsed.format[matchedKey]
        : parsed.format.default;
    }

    if (typeof formatStr === 'string') {
      return (formatStr.match(/\./g) || []).length;
    }
  }

  // Fallback to our compiled map if format is undefined
  if (countryLengthFallback[iso]) {
    return countryLengthFallback[iso];
  }

  return null;
};

export const mobileValidator = (mobile, countryCode) => {
  let error = '';

  if (!mobile || mobile.length <= 0) error = ' is required';
  else if (!mobileRegex.test(mobile)) error = ' is not valid';
  else if (countryCode) {
    const expectedLength = getExpectedPhoneLength(countryCode, mobile);
    if (expectedLength !== null) {
      if (Array.isArray(expectedLength)) {
        if (!expectedLength.includes(mobile.length)) {
          error = ` must be ${expectedLength.join(' or ')} digits`;
        }
      } else if (mobile.length !== expectedLength) {
        error = ` must be ${expectedLength} digits`;
      }
    } else if (mobile.length < 8) {
      error = ' is not valid';
    }
  } else if (mobile.length < 8) {
    error = ' is not valid';
  }
  return error;
};

export const urlValidator = url => {
  let error = '';

  if (!url || url.length <= 0) error = ' is required';
  else if (!urlRegex.test(url) || url.length < 3) error = ' is not valid';
  return error;
};

export const breakTimeValidator = min => {
  let error = '';

  if (!min || min.length <= 0) error = ' is required';
  else if (!mobileRegex.test(min)) error = ' is not valid';
  return error;
};

export const addressValidator = address => {
  let error = '';

  if (!address || address.length <= 0) error = ' is required';
  else if (address.length <= 2) error = ' is not valid';

  return error;
};

export const endTimeValidator = (endtime, starttime) => {
  let error = '';

  if (!endtime || endtime.length <= 0) error = ' is required';
  // Validation: End time should not be less than start time
  else if (starttime && endtime < starttime)
    error = ' must be after start time';

  return error;
};

export const confirmPasswordValidator = (password, confirmPassword) => {
  let error = '';

  if (!confirmPassword || confirmPassword.length <= 0) error = ' is required';
  // Validation: End time should not be less than start time
  else if (password != confirmPassword) error = ' does not match';

  return error;
};

export const addAppandUrlTime = (time1, time2) => {
  // Split the time values into hours and minutes
  const [hours1, minutes1] = time1.split(':');
  const [hours2, minutes2] = time2.split(':');

  // Convert the time values to minutes
  const totalMinutes1 = parseInt(hours1) * 60 + parseInt(minutes1);
  const totalMinutes2 = parseInt(hours2) * 60 + parseInt(minutes2);

  // Add the total minutes
  const totalMinutes = totalMinutes1 + totalMinutes2;

  // Convert the total minutes back to hours and minutes
  const resultHours = Math.floor(totalMinutes / 60);
  const resultMinutes = totalMinutes % 60;

  // Format the result
  return `${resultHours}h:${resultMinutes.toString().padStart(2, '0')}m`;
};

export const checkMatchingwithCurrentDate = date => {
  const today = new Date();
  const givenDate = new Date(date);

  if (
    givenDate.getFullYear() === today.getFullYear() &&
    givenDate.getMonth() === today.getMonth() &&
    givenDate.getDate() === today.getDate()
  ) {
    return true;
  } else {
    return false;
  }
};

const formatDate = date => {
  const year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();

  // Ensure month and day are two digits
  if (month < 10) {
    month = `0${month}`;
  }
  if (day < 10) {
    day = `0${day}`;
  }

  return `${year}-${month}-${day}`;
};

export const getCurrentandPreviousweekDate = () => {
  const currentDate = new Date();

  // Calculate previous week date (subtract 7 days)
  const previousWeekDate = new Date(currentDate);
  previousWeekDate.setDate(previousWeekDate.getDate() - 6);

  // Format dates
  const formattedCurrentDate = formatDate(currentDate);
  const formattedPreviousWeekDate = formatDate(previousWeekDate);

  let dates = [];
  dates.push(formattedPreviousWeekDate, formattedCurrentDate);
  return dates;
};

export const getCurrentandLast90Date = () => {
  const currentDate = new Date();

  // Calculate previous week date (subtract 7 days)
  const previousWeekDate = new Date(currentDate);
  previousWeekDate.setDate(previousWeekDate.getDate() - 89);

  // Format dates
  const formattedCurrentDate = formatDate(currentDate);
  const formattedPreviousWeekDate = formatDate(previousWeekDate);

  let dates = [];
  dates.push(formattedPreviousWeekDate, formattedCurrentDate);
  return dates;
};

export const parseTimeToDecimal = timeString => {
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  return hours + minutes / 60 + seconds / 3600;
};

export const formatToBackendIST = date => {
  return moment(date).utcOffset('+05:30').format('YYYY-MM-DD HH:mm:ss');
};

export const priceCategory = fees => {
  if (fees <= 18999) {
    return 'Bronze';
  } else if (fees <= 28999) {
    return 'Silver';
  } else if (fees <= 38999) {
    return 'Gold';
  } else {
    return 'Diamond';
  }
};

export const shortRelativeTime = date => {
  const diffSeconds = moment().diff(
    moment(date, 'YYYY-MM-DD HH:mm:ss'),
    'seconds',
  );

  if (diffSeconds < 60) return `${diffSeconds}s ago`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}w ago`;
};

export const priceValidator = (price, totalprice, isCommecial = false) => {
  let error = '';

  if (!price || price.length <= 0) error = ' is required';
  else if (price > totalprice)
    error = ` is > ${isCommecial == true ? 'Commercial' : 'total amount'}`;

  return error;
};

export const discountValidator = discount => {
  let error = '';

  if (discount > 99) error = ' must be less than 100';

  return error;
};

export const getBalanceAmount = (totalAmount, paidAmount) => {
  let result = totalAmount - paidAmount;
  return parseFloat(result.toFixed(2)); // keeps 2 decimals
};

export const calculateAmount = (price, gst = 0) => {
  if (typeof price !== 'number' || price < 0) {
    throw new Error('Price must be a positive number');
  }

  let finalPrice = price;

  // Apply GST if given
  if (gst > 0) {
    finalPrice += (finalPrice * gst) / 100;
  }

  return parseFloat(finalPrice.toFixed(2)); // keep 2 decimals
};

export const getConvenienceFees = totalAmount => {
  console.log(typeof totalAmount, totalAmount);
  const value = parseFloat(totalAmount);
  // Calculate 3% of the amount
  const fees = (value * 3) / 100;

  // Round to 2 decimals
  return parseFloat(fees.toFixed(2));
};

export const accountNumberValidator = accountnumber => {
  let error = '';

  if (!accountnumber || accountnumber.length <= 0) error = ' is required';
  else if (
    !mobileRegex.test(accountnumber) ||
    accountnumber.length < 9 ||
    accountnumber.length > 18
  )
    error = ' is not valid';
  return error;
};

export const ifscValidator = ifsc => {
  let error = '';

  if (!ifsc || ifsc.length <= 0) error = ' is required';
  else if (!ifscRegex.test(ifsc)) error = ' is not valid';
  return error;
};

export const percentageValidator = percent => {
  let error = '';

  if (percent === '' || percent === null || isNaN(percent))
    error = ' is required';
  else if (percent > 100) error = ' must be 100 or less';
  return error;
};

// Reusable debounce function
export const debounce = (func, delay) => {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

export const capitalizeWords = text => {
  return text
    .split(' ')
    .map(word =>
      word.length > 0
        ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        : '',
    )
    .join(' ');
};

export const getRangeLabel = (startDate, endDate) => {
  const today = dayjs();
  const start = dayjs(startDate);
  const end = dayjs(endDate);

  // Helper to check if two dates are the same day
  const isSame = (d1, d2) => d1.isSame(d2, 'day');

  // Compare with predefined ranges
  if (isSame(start, today) && isSame(end, today)) return 'Today';
  if (
    isSame(start, today.subtract(1, 'day')) &&
    isSame(end, today.subtract(1, 'day'))
  )
    return 'Yesterday';

  if (isSame(start, today.subtract(6, 'day')) && isSame(end, today))
    return '7 Days';
  if (isSame(start, today.subtract(14, 'day')) && isSame(end, today))
    return '15 Days';
  if (isSame(start, today.subtract(29, 'day')) && isSame(end, today))
    return '30 Days';
  if (isSame(start, today.subtract(59, 'day')) && isSame(end, today))
    return '60 Days';
  if (isSame(start, today.subtract(89, 'day')) && isSame(end, today))
    return '90 Days';

  return null;
};

export const isWithin30Days = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // difference in milliseconds
  const diffMs = end - start;

  // convert ms → days
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays <= 30;
};

export const getDatesFromRangeLabel = label => {
  const today = dayjs();
  let start_date, end_date;

  switch (label.toLowerCase()) {
    case 'today':
      start_date = today;
      end_date = today;
      break;

    case 'yesterday':
      start_date = today.subtract(1, 'day');
      end_date = today.subtract(1, 'day');
      break;

    case 'one month': {
      const todayDate = today.date();

      if (todayDate <= 25) {
        start_date = today.subtract(1, 'month').date(26);
        end_date = today.date(25);
      } else {
        start_date = today.date(26);
        end_date = today.add(1, 'month').date(25);
      }
      break;
    }

    case '7 days':
    case 'last7days':
      start_date = today.subtract(6, 'day');
      end_date = today;
      break;

    case '15 days':
    case 'last15days':
      start_date = today.subtract(14, 'day');
      end_date = today;
      break;

    case '30 days':
    case 'last30days':
      start_date = today.subtract(29, 'day');
      end_date = today;
      break;

    case '60 days':
    case 'last60days':
      start_date = today.subtract(59, 'day');
      end_date = today;
      break;

    case '90 days':
    case 'last90days':
      start_date = today.subtract(89, 'day');
      end_date = today;
      break;

    default:
      return null; // for "Custom" or unsupported labels
  }

  return {
    card_settings: {
      start_date: start_date.format('YYYY-MM-DD'),
      end_date: end_date.format('YYYY-MM-DD'),
    },
  };
};

/** Billing month range (26th → 25th), same as CommonMuiCustomDatePicker "This Month". */
export const getThisMonthDateRange = () => {
  const range = getDatesFromRangeLabel('One Month');
  if (!range?.card_settings) {
    return getCurrentandPreviousweekDate();
  }
  return [range.card_settings.start_date, range.card_settings.end_date];
};

export const getLast3Months = () => {
  const end = dayjs(); // current month
  const start = end.subtract(2, 'month'); // last 3 months range

  return [start.format('YYYY-MM'), end.format('YYYY-MM')];
};

export const customizeStartDateAndEndDate = months => {
  const start = dayjs(months[0]);
  const end = dayjs(months[1]);

  const startDate = start.subtract(1, 'month').date(26).format('YYYY-MM-DD');

  const endDate = end.date(25).format('YYYY-MM-DD');

  return [startDate, endDate];
};

export const getActiveTargetMonthRange = () => {
  const today = dayjs();

  const currentMonth = today.startOf('month');
  const nextMonth = today.add(1, 'month').startOf('month');

  // After 26th select next month
  const activeMonth = today.date() >= 26 ? nextMonth : currentMonth;

  const month = activeMonth.format('MMMM - YYYY');

  const [monthName, year] = month.split(' - ');
  const selectedMonth = moment(`${monthName} ${year}`, 'MMMM YYYY');

  const startDate = selectedMonth
    .clone()
    .subtract(1, 'month')
    .date(26)
    .format('YYYY-MM-DD');

  const endDate = selectedMonth.clone().date(25).format('YYYY-MM-DD');

  return {
    month,
    startDate,
    endDate,
  };
};

export const validateConvenienceFee = (payAmount, convenienceFees) => {
  let error = '';

  const threePercent = (payAmount * 3) / 100;

  if (convenienceFees == threePercent) {
    error = '';
  } else {
    error = ' is mismatch';
  }
  return error;
};

export const calculateThreePercentAmount = payAmount => {
  let error = '';

  const threePercent = (payAmount * 3) / 100;
  return threePercent;
};

export const formatAddress = value => {
  if (!value) return value;

  return value
    .split(',')
    .map(part =>
      part
        .split(' ')
        .map(word => {
          if (!word) return '';

          word = word.replace(
            /(\d+)([a-zA-Z])/g,
            (_, num, char) => num + char.toUpperCase(),
          );

          if (/^\d+$/.test(word)) return word;

          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' '),
    )
    .join(', ');
};
