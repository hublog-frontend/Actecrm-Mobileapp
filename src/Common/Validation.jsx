const nameRegex = /^[a-zA-Z]+(?: [a-zA-Z]+)*$/;
const descriptionRegex = /^(?!\s*$).+/;
const emailRegex =
  /^[a-zA-Z0-9]+([._-]?[a-zA-Z0-9]+)*@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
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

export const mobileValidator = mobile => {
  let error = '';

  if (!mobile || mobile.length <= 0) error = ' is required';
  else if (!mobileRegex.test(mobile) || mobile.length < 8)
    error = ' is not valid';
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
