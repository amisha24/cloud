const fs = require('fs');


class Data_Processing {
  constructor() {
    this.raw_user_data = [];
    this.formatted_user_data = []; // Adding formatted user data property
    this.cleaned_user_data = []; 
  }

  load_CSV(filename) {
    
    try {
    
      this.raw_user_data = fs.readFileSync(`${filename}.csv`, 'utf8');
      //this.raw_user_data = this.raw_user_data.replace(/\r/g, '');
    } catch (err) {
      console.error('Error reading the CSV file:', err);
      
    }
    
  }


  format_data() {
    // Check if raw user data is empty or not
    if (this.raw_user_data.length === 0) {
      console.error('No raw user data to format');
      return;
    }

    // Function to convert words to numbers
    const wordsToNumbers = (word) => {
      const wordsMap = {
        'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
        'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14,
        'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18,
        'nineteen': 19, 'twenty': 20, 'thirty': 30, 'forty': 40,
        'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80,
        'ninety': 90
      };

      const tokens = word.split('-');
      let number = 0;

      tokens.forEach(token => {
        if (wordsMap[token]) {
          number += wordsMap[token];
        }
      });

      return number;
    };

    // Split raw user data by lines to get individual user data
    const users = this.raw_user_data.trim().split('\n');

    // Map over each user and format their data
    this.formatted_user_data = users.map(user => {
      // Split the user data by comma
      const [fullName, dateOfBirth, age, email] = user.split(',');

      // Function to parse date of birth into DD/MM/YYYY format
      const parseDateOfBirth = (dob) => {
        // Check if the date of birth is in words format
        const wordsFormatRegex = /^(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})$/;
        if (wordsFormatRegex.test(dob)) {
          const [, day, month, year] = dob.match(wordsFormatRegex);
          const monthIndex = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(month);
          return `${day.padStart(2, '0')}/${(monthIndex + 1).toString().padStart(2, '0')}/${year}`;
        }

        // Check if the date of birth is in dd/mm/yy format
        const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/;
        if (dateRegex.test(dob)) {
          const [, day, month, year] = dob.match(dateRegex);
          const currentYear = new Date().getFullYear();
          const prefix = parseInt(year) > parseInt(currentYear.toString().slice(-2)) ? '19' : '20';
          return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${prefix}${year}`;
        }

        // Return original date of birth if format not recognized
        return dob;
      };

      // Convert age from words to numbers
      const numericAge = isNaN(parseInt(age)) ? wordsToNumbers(age.toLowerCase()) : parseInt(age);

      // Extract title, first name, middle name, and surname from the full name
      const nameParts = fullName.split(' ');
      let title = '';
      let firstName = '';
      let middleName = '';
      let surname = '';

      // Check if title is present and assign it accordingly
      if (['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Dr.'].includes(nameParts[0])) {
        title = nameParts[0];
        nameParts.shift(); // Remove the title from the name parts
      }

      // Assign the remaining name parts to firstName, middleName, and surname
      if (nameParts.length > 0) {
        firstName = nameParts.shift();
        surname = nameParts.pop();
        middleName = nameParts.join(' ');
      }

      // Return formatted user data
      return {
        title: title || '', // Ensure title is not undefined
        first_name: firstName || '', // Ensure first name is not undefined
        middle_name: middleName || '', // Ensure middle name is not undefined
        surname: surname || '', // Ensure surname is not undefined
        date_of_birth: parseDateOfBirth(dateOfBirth) || '', // Ensure date of birth is not undefined
        age: numericAge || 0, // Ensure age is parsed as integer and default to 0 if undefined
        email: email || '' // Ensure email is not undefined
      };
    });

    // Print formatted user data
    this.formatted_user_data.forEach(user => {
      console.log(user.title);
    });
  }

  

  clean_data() {


    // Function to calculate age based on date of birth and current date
    const calculate_age = (birth_date) => {
        //const birthDate = parseDateOfBirth(birth_date);
        if (!birthDate) {
          return null; // Return null for invalid date of birth
        }
        const currentDate = new Date();
        let age = currentDate.getFullYear() - birthDate.getFullYear();
        const monthDiff = currentDate.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      };
  
      // Iterate over each user data and correct the age
      this.formatted_user_data.forEach(user => {
        user.age = calculate_age(user.date_of_birth);
      });


    // Function to clean title
    const clean_title = (title) => {
      title = title.trim(); // Trim whitespace
      const validTitles = ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr'];
      // Convert 'Dr.' to 'Dr'
      if (title === 'Dr.') {
        title = 'Dr';
    }

      // Check if the title is valid
      if (validTitles.includes(title)) {
        return title;
      } else {
        return ''; // Return empty string for invalid titles
      }
    };

    
    // Function to fill missing first names using email
    const fill_missing_first_name = (user) => {
        if (user.first_name === '') {
            const emailParts = user.email.split('@')[0].split('.');
            if (emailParts.length >= 2) {
                user.first_name = emailParts[0];
            }
        }
        return user;
    };
     // Function to fill missing last names using email
     const fill_missing_last_name = (user) => {
        if (user.surname === '') {
            const emailParts = user.email.split('@')[0].split('.');
            if (emailParts.length >= 2) {
                user.surname = emailParts[1];
            }
        }
        return user;
    };
    const format_email = (user) => {
        if (user.email === '') {
            // If email is missing, construct it using first name and surname
            user.email = `${user.first_name}.${user.surname}@example.com`;
        } else {
            // If email is provided but missing first name or surname
            const emailParts = user.email.split('@')[0].split('.');
            if (emailParts.length === 2) {
                if (user.first_name === '') {
                    user.first_name = emailParts[0];
                }
                if (user.surname === '') {
                    user.surname = emailParts[1];
                }
                // Reconstruct email using the updated first name and surname
                user.email = `${user.first_name}.${user.surname}@example.com`;
            }
        }
        return user;
    };


    // Check if formatted user data is empty or not
    if (this.formatted_user_data.length === 0) {
      console.error('No formatted user data to clean');
      return;
    }

    // Map over each formatted user data and clean the title
    this.cleaned_user_data = this.formatted_user_data.map(user => {
      // Extract title from the formatted user data
      let title = user.title;

      // Clean the title if necessary
      if (title !== '') {
        title = clean_title(title);
      }
      
      

       
      // Update the user object with cleaned title
      return {
        ...user,
        title: title
      };
    });

     // Fill missing first names using email
     this.cleaned_user_data = this.cleaned_user_data.map(user => {
        return fill_missing_first_name(user);
    });

    // Fill missing last names using email
    this.cleaned_user_data = this.cleaned_user_data.map(user => {
        return fill_missing_last_name(user);
    });
     // Format email addresses
     //this.cleaned_user_data = this.cleaned_user_data.map(user => {
        //return format_email(user);
    //});


   

    // Delete rows after row 148
    this.cleaned_user_data = this.cleaned_user_data.slice(0, 148);

    // Print cleaned user data
    console.log("Cleaned User Data:");

    this.cleaned_user_data.forEach(user => {
      console.log(user);
    
    });
  }
}