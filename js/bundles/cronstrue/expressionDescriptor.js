import { StringUtilities } from "./stringUtilities";
import { CronParser } from "./cronParser";
export class ExpressionDescriptor {
    constructor(expression, options) {
        this.expression = expression;
        this.options = options;
        this.expressionParts = new Array(5);
        if (ExpressionDescriptor.locales[options.locale]) {
            this.i18n = ExpressionDescriptor.locales[options.locale];
        }
        else {
            console.warn(`Locale '${options.locale}' could not be found; falling back to 'en'.`);
            this.i18n = ExpressionDescriptor.locales["en"];
        }
        if (options.use24HourTimeFormat === undefined) {
            options.use24HourTimeFormat = this.i18n.use24HourTimeFormatByDefault();
        }
    }
    static toString(expression, { throwExceptionOnParseError = true, verbose = false, dayOfWeekStartIndexZero = true, use24HourTimeFormat, locale = "en" } = {}) {
        let options = {
            throwExceptionOnParseError: throwExceptionOnParseError,
            verbose: verbose,
            dayOfWeekStartIndexZero: dayOfWeekStartIndexZero,
            use24HourTimeFormat: use24HourTimeFormat,
            locale: locale
        };
        let descripter = new ExpressionDescriptor(expression, options);
        return descripter.getFullDescription();
    }
    static initialize(localesLoader) {
        ExpressionDescriptor.specialCharacters = ["/", "-", ",", "*"];
        localesLoader.load(ExpressionDescriptor.locales);
    }
    getFullDescription() {
        let description = "";
        try {
            let parser = new CronParser(this.expression, this.options.dayOfWeekStartIndexZero);
            this.expressionParts = parser.parse();
            var timeSegment = this.getTimeOfDayDescription();
            var dayOfMonthDesc = this.getDayOfMonthDescription();
            var monthDesc = this.getMonthDescription();
            var dayOfWeekDesc = this.getDayOfWeekDescription();
            var yearDesc = this.getYearDescription();
            description += timeSegment + dayOfMonthDesc + dayOfWeekDesc + monthDesc + yearDesc;
            description = this.transformVerbosity(description, this.options.verbose);
            description = description.charAt(0).toLocaleUpperCase() + description.substr(1);
        }
        catch (ex) {
            if (!this.options.throwExceptionOnParseError) {
                description = this.i18n.anErrorOccuredWhenGeneratingTheExpressionD();
            }
            else {
                throw `${ex}`;
            }
        }
        return description;
    }
    getTimeOfDayDescription() {
        let secondsExpression = this.expressionParts[0];
        let minuteExpression = this.expressionParts[1];
        let hourExpression = this.expressionParts[2];
        let description = "";
        if (!StringUtilities.containsAny(minuteExpression, ExpressionDescriptor.specialCharacters) &&
            !StringUtilities.containsAny(hourExpression, ExpressionDescriptor.specialCharacters) &&
            !StringUtilities.containsAny(secondsExpression, ExpressionDescriptor.specialCharacters)) {
            description += this.i18n.atSpace() + this.formatTime(hourExpression, minuteExpression, secondsExpression);
        }
        else if (!secondsExpression &&
            minuteExpression.indexOf("-") > -1 &&
            !(minuteExpression.indexOf(",") > -1) &&
            !(minuteExpression.indexOf("/") > -1) &&
            !StringUtilities.containsAny(hourExpression, ExpressionDescriptor.specialCharacters)) {
            let minuteParts = minuteExpression.split("-");
            description += StringUtilities.format(this.i18n.everyMinuteBetweenX0AndX1(), this.formatTime(hourExpression, minuteParts[0], ""), this.formatTime(hourExpression, minuteParts[1], ""));
        }
        else if (!secondsExpression &&
            hourExpression.indexOf(",") > -1 &&
            hourExpression.indexOf("-") == -1 &&
            hourExpression.indexOf("/") == -1 &&
            !StringUtilities.containsAny(minuteExpression, ExpressionDescriptor.specialCharacters)) {
            let hourParts = hourExpression.split(",");
            description += this.i18n.at();
            for (let i = 0; i < hourParts.length; i++) {
                description += " ";
                description += this.formatTime(hourParts[i], minuteExpression, "");
                if (i < hourParts.length - 2) {
                    description += ",";
                }
                if (i == hourParts.length - 2) {
                    description += this.i18n.spaceAnd();
                }
            }
        }
        else {
            let secondsDescription = this.getSecondsDescription();
            let minutesDescription = this.getMinutesDescription();
            let hoursDescription = this.getHoursDescription();
            description += secondsDescription;
            if (description.length > 0 && minutesDescription.length > 0) {
                description += ", ";
            }
            description += minutesDescription;
            if (description.length > 0 && hoursDescription.length > 0) {
                description += ", ";
            }
            description += hoursDescription;
        }
        return description;
    }
    getSecondsDescription() {
        let description = this.getSegmentDescription(this.expressionParts[0], this.i18n.everySecond(), s => {
            return s;
        }, s => {
            return StringUtilities.format(this.i18n.everyX0Seconds(), s);
        }, s => {
            return this.i18n.secondsX0ThroughX1PastTheMinute();
        }, s => {
            return s == "0"
                ? ""
                : parseInt(s) < 20
                    ? this.i18n.atX0SecondsPastTheMinute()
                    : this.i18n.atX0SecondsPastTheMinuteGt20() || this.i18n.atX0SecondsPastTheMinute();
        });
        return description;
    }
    getMinutesDescription() {
        const secondsExpression = this.expressionParts[0];
        let description = this.getSegmentDescription(this.expressionParts[1], this.i18n.everyMinute(), s => {
            return s;
        }, s => {
            return StringUtilities.format(this.i18n.everyX0Minutes(), s);
        }, s => {
            return this.i18n.minutesX0ThroughX1PastTheHour();
        }, s => {
            try {
                return s == "0" && secondsExpression == ""
                    ? ""
                    : parseInt(s) < 20
                        ? this.i18n.atX0MinutesPastTheHour()
                        : this.i18n.atX0MinutesPastTheHourGt20() || this.i18n.atX0MinutesPastTheHour();
            }
            catch (e) {
                return this.i18n.atX0MinutesPastTheHour();
            }
        });
        return description;
    }
    getHoursDescription() {
        let expression = this.expressionParts[2];
        let description = this.getSegmentDescription(expression, this.i18n.everyHour(), s => {
            return this.formatTime(s, "0", "");
        }, s => {
            return StringUtilities.format(this.i18n.everyX0Hours(), s);
        }, s => {
            return this.i18n.betweenX0AndX1();
        }, s => {
            return this.i18n.atX0();
        });
        return description;
    }
    getDayOfWeekDescription() {
        var daysOfWeekNames = this.i18n.daysOfTheWeek();
        let description = null;
        if (this.expressionParts[5] == "*") {
            description = "";
        }
        else {
            description = this.getSegmentDescription(this.expressionParts[5], this.i18n.commaEveryDay(), s => {
                let exp = s;
                if (s.indexOf("#") > -1) {
                    exp = s.substr(0, s.indexOf("#"));
                }
                else if (s.indexOf("L") > -1) {
                    exp = exp.replace("L", "");
                }
                return daysOfWeekNames[parseInt(exp)];
            }, s => {
                return StringUtilities.format(this.i18n.commaEveryX0DaysOfTheWeek(), s);
            }, s => {
                return this.i18n.commaX0ThroughX1();
            }, s => {
                let format = null;
                if (s.indexOf("#") > -1) {
                    let dayOfWeekOfMonthNumber = s.substring(s.indexOf("#") + 1);
                    let dayOfWeekOfMonthDescription = null;
                    switch (dayOfWeekOfMonthNumber) {
                        case "1":
                            dayOfWeekOfMonthDescription = this.i18n.first();
                            break;
                        case "2":
                            dayOfWeekOfMonthDescription = this.i18n.second();
                            break;
                        case "3":
                            dayOfWeekOfMonthDescription = this.i18n.third();
                            break;
                        case "4":
                            dayOfWeekOfMonthDescription = this.i18n.fourth();
                            break;
                        case "5":
                            dayOfWeekOfMonthDescription = this.i18n.fifth();
                            break;
                    }
                    format = this.i18n.commaOnThe() + dayOfWeekOfMonthDescription + this.i18n.spaceX0OfTheMonth();
                }
                else if (s.indexOf("L") > -1) {
                    format = this.i18n.commaOnTheLastX0OfTheMonth();
                }
                else {
                    const domSpecified = this.expressionParts[3] != "*";
                    format = domSpecified ? this.i18n.commaAndOnX0() : this.i18n.commaOnlyOnX0();
                }
                return format;
            });
        }
        return description;
    }
    getMonthDescription() {
        var monthNames = this.i18n.monthsOfTheYear();
        let description = this.getSegmentDescription(this.expressionParts[4], "", s => {
            return monthNames[parseInt(s) - 1];
        }, s => {
            return StringUtilities.format(this.i18n.commaEveryX0Months(), s);
        }, s => {
            return this.i18n.commaMonthX0ThroughMonthX1() || this.i18n.commaX0ThroughX1();
        }, s => {
            return this.i18n.commaOnlyInX0();
        });
        return description;
    }
    getDayOfMonthDescription() {
        let description = null;
        let expression = this.expressionParts[3];
        switch (expression) {
            case "L":
                description = this.i18n.commaOnTheLastDayOfTheMonth();
                break;
            case "WL":
            case "LW":
                description = this.i18n.commaOnTheLastWeekdayOfTheMonth();
                break;
            default:
                let weekDayNumberMatches = expression.match(/(\d{1,2}W)|(W\d{1,2})/);
                if (weekDayNumberMatches) {
                    let dayNumber = parseInt(weekDayNumberMatches[0].replace("W", ""));
                    let dayString = dayNumber == 1
                        ? this.i18n.firstWeekday()
                        : StringUtilities.format(this.i18n.weekdayNearestDayX0(), dayNumber.toString());
                    description = StringUtilities.format(this.i18n.commaOnTheX0OfTheMonth(), dayString);
                    break;
                }
                else {
                    let lastDayOffSetMatches = expression.match(/L-(\d{1,2})/);
                    if (lastDayOffSetMatches) {
                        let offSetDays = lastDayOffSetMatches[1];
                        description = StringUtilities.format(this.i18n.commaDaysBeforeTheLastDayOfTheMonth(), offSetDays);
                        break;
                    }
                    else {
                        description = this.getSegmentDescription(expression, this.i18n.commaEveryDay(), s => {
                            return s == "L" ? this.i18n.lastDay() : s;
                        }, s => {
                            return s == "1" ? this.i18n.commaEveryDay() : this.i18n.commaEveryX0Days();
                        }, s => {
                            return this.i18n.commaBetweenDayX0AndX1OfTheMonth();
                        }, s => {
                            return this.i18n.commaOnDayX0OfTheMonth();
                        });
                    }
                    break;
                }
        }
        return description;
    }
    getYearDescription() {
        let description = this.getSegmentDescription(this.expressionParts[6], "", s => {
            return /^\d+$/.test(s) ? new Date(parseInt(s), 1).getFullYear().toString() : s;
        }, s => {
            return StringUtilities.format(this.i18n.commaEveryX0Years(), s);
        }, s => {
            return this.i18n.commaYearX0ThroughYearX1() || this.i18n.commaX0ThroughX1();
        }, s => {
            return this.i18n.commaOnlyInX0();
        });
        return description;
    }
    getSegmentDescription(expression, allDescription, getSingleItemDescription, getIntervalDescriptionFormat, getBetweenDescriptionFormat, getDescriptionFormat) {
        let description = null;
        if (!expression) {
            description = "";
        }
        else if (expression === "*") {
            description = allDescription;
        }
        else if (!StringUtilities.containsAny(expression, ["/", "-", ","])) {
            description = StringUtilities.format(getDescriptionFormat(expression), getSingleItemDescription(expression));
        }
        else if (expression.indexOf("/") > -1) {
            let segments = expression.split("/");
            description = StringUtilities.format(getIntervalDescriptionFormat(segments[1]), getSingleItemDescription(segments[1]));
            if (segments[0].indexOf("-") > -1) {
                let betweenSegmentDescription = this.generateBetweenSegmentDescription(segments[0], getBetweenDescriptionFormat, getSingleItemDescription);
                if (betweenSegmentDescription.indexOf(", ") != 0) {
                    description += ", ";
                }
                description += betweenSegmentDescription;
            }
            else if (!StringUtilities.containsAny(segments[0], ["*", ","])) {
                let rangeItemDescription = StringUtilities.format(getDescriptionFormat(segments[0]), getSingleItemDescription(segments[0]));
                rangeItemDescription = rangeItemDescription.replace(", ", "");
                description += StringUtilities.format(this.i18n.commaStartingX0(), rangeItemDescription);
            }
        }
        else if (expression.indexOf(",") > -1) {
            let segments = expression.split(",");
            let descriptionContent = "";
            for (let i = 0; i < segments.length; i++) {
                if (i > 0 && segments.length > 2) {
                    descriptionContent += ",";
                    if (i < segments.length - 1) {
                        descriptionContent += " ";
                    }
                }
                if (i > 0 && segments.length > 1 && (i == segments.length - 1 || segments.length == 2)) {
                    descriptionContent += `${this.i18n.spaceAnd()} `;
                }
                if (segments[i].indexOf("-") > -1) {
                    let betweenSegmentDescription = this.generateBetweenSegmentDescription(segments[i], s => {
                        return this.i18n.commaX0ThroughX1();
                    }, getSingleItemDescription);
                    betweenSegmentDescription = betweenSegmentDescription.replace(", ", "");
                    descriptionContent += betweenSegmentDescription;
                }
                else {
                    descriptionContent += getSingleItemDescription(segments[i]);
                }
            }
            description = StringUtilities.format(getDescriptionFormat(expression), descriptionContent);
        }
        else if (expression.indexOf("-") > -1) {
            description = this.generateBetweenSegmentDescription(expression, getBetweenDescriptionFormat, getSingleItemDescription);
        }
        return description;
    }
    generateBetweenSegmentDescription(betweenExpression, getBetweenDescriptionFormat, getSingleItemDescription) {
        let description = "";
        let betweenSegments = betweenExpression.split("-");
        let betweenSegment1Description = getSingleItemDescription(betweenSegments[0]);
        let betweenSegment2Description = getSingleItemDescription(betweenSegments[1]);
        betweenSegment2Description = betweenSegment2Description.replace(":00", ":59");
        let betweenDescriptionFormat = getBetweenDescriptionFormat(betweenExpression);
        description += StringUtilities.format(betweenDescriptionFormat, betweenSegment1Description, betweenSegment2Description);
        return description;
    }
    formatTime(hourExpression, minuteExpression, secondExpression) {
        let hour = parseInt(hourExpression);
        let period = "";
        if (!this.options.use24HourTimeFormat) {
            period = hour >= 12 ? " PM" : " AM";
            if (hour > 12) {
                hour -= 12;
            }
            if (hour === 0) {
                hour = 12;
            }
        }
        let minute = minuteExpression;
        let second = "";
        if (secondExpression) {
            second = `:${("00" + secondExpression).substring(secondExpression.length)}`;
        }
        return `${("00" + hour.toString()).substring(hour.toString().length)}:${("00" + minute.toString()).substring(minute.toString().length)}${second}${period}`;
    }
    transformVerbosity(description, useVerboseFormat) {
        if (!useVerboseFormat) {
            description = description.replace(new RegExp(this.i18n.commaEveryMinute(), "g"), "");
            description = description.replace(new RegExp(this.i18n.commaEveryHour(), "g"), "");
            description = description.replace(new RegExp(this.i18n.commaEveryDay(), "g"), "");
            description = description.replace(/\, ?$/, "");
        }
        return description;
    }
}
ExpressionDescriptor.locales = {};
