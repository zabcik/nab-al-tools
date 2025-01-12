import * as Common from "../Common";
import { attributePattern, ignoreCodeLinePattern } from "../constants";
import { ALCodeLine } from "./ALCodeLine";
import { ALControl } from "./ALControl";
import { ALPageField } from "./ALPageField";
import { ALPagePart } from "./ALPagePart";
import { ALProcedure } from "./ALProcedure";
import { ALProperty } from "./ALProperty";
import { ALTableField } from "./ALTableField";
import { ALXmlComment } from "./ALXmlComment";
import {
  ALControlType,
  ALObjectType,
  MultiLanguageType,
  XliffTokenType,
} from "./Enums";
import { multiLanguageTypeMap } from "./Maps";
import { MultiLanguageObject } from "./MultiLanguageObject";

export function parseCode(
  parent: ALControl,
  startLineIndex: number,
  startLevel: number
): number {
  let level = startLevel;
  parseXmlComments(parent, parent.alCodeLines, startLineIndex - 1);
  if (
    parent.getObjectType() === ALObjectType.interface &&
    parent.type === ALControlType.procedure
  ) {
    return startLineIndex;
  }
  for (
    let lineNo = startLineIndex;
    lineNo < parent.alCodeLines.length;
    lineNo++
  ) {
    const codeLine = parent.alCodeLines[lineNo];
    let matchFound = false;
    const increaseResult = matchIndentationIncreased(codeLine);
    if (increaseResult) {
      level++;
    }
    const decreaseResult = matchIndentationDecreased(codeLine);
    if (decreaseResult) {
      level--;
      if (level <= startLevel) {
        codeLine.indentation = level;
        return lineNo;
      }
    }
    codeLine.indentation = level;
    if (!matchFound) {
      if (!parent.isALCode) {
        const property = getProperty(parent, lineNo, codeLine);
        if (property) {
          parent.properties.push(property);
          matchFound = true;
        }
        if (!matchFound) {
          const mlProperty = getMlProperty(parent, lineNo, codeLine);
          if (mlProperty) {
            parent.multiLanguageObjects.push(mlProperty);
            matchFound = true;
          }
        }
        if (!matchFound) {
          let alControl = matchALControl(parent, lineNo, codeLine);
          if (alControl) {
            if (
              alControl.type === ALControlType.procedure &&
              parent.getObject().publicAccess
            ) {
              alControl = parseProcedureDeclaration(
                alControl,
                parent.alCodeLines,
                lineNo
              );
            }
            parent.controls.push(alControl);
            lineNo = parseCode(alControl, lineNo + 1, level);
            alControl.endLineIndex = lineNo;
            matchFound = true;
          }
        }
      }
    }
    if (!matchFound) {
      const label = getLabel(parent, lineNo, codeLine);
      if (label) {
        parent.multiLanguageObjects?.push(label);
      }
    }
  }
  return parent.alCodeLines.length;
}

function parseProcedureDeclaration(
  alControl: ALControl,
  alCodeLines: ALCodeLine[],
  procedureLineNo: number
): ALControl {
  try {
    const attributes: string[] = [];
    let lineNo = procedureLineNo - 1;
    let loop = true;
    do {
      const line = alCodeLines[lineNo].code;
      const attributeMatch = line.match(attributePattern);
      if (attributeMatch) {
        if (attributeMatch.groups?.attribute) {
          attributes.push(attributeMatch[0].trim());
        }
      } else {
        const ignoreRegex = new RegExp(ignoreCodeLinePattern, "im");
        // console.log(ignoreCodeLinePattern); // Comment out
        const ignoreMatch = line.match(ignoreRegex);
        if (!ignoreMatch) {
          loop = false;
        }
      }
      lineNo--;
      if (lineNo <= 0) {
        loop = false;
      }
    } while (loop);

    const procedureDeclarationArr: string[] = [];
    procedureDeclarationArr.push(alCodeLines[procedureLineNo].code.trim());
    lineNo = procedureLineNo + 1;
    loop = true;
    do {
      const line = alCodeLines[lineNo].code;
      if (line.match(/^\s*var\s*$|^\s*begin\s*$/i)) {
        loop = false;
      } else if (
        alControl.parent?.getObjectType() === ALObjectType.interface &&
        (line.trim() === "" ||
          line.match(/.*procedure .*/i) ||
          line.match(/\s*\/\/\/.*/i))
      ) {
        loop = false;
      } else {
        if (!line.match(/^\s*\/\/.*/)) {
          procedureDeclarationArr.push(line.trim());
        }
      }
      lineNo++;
      if (lineNo >= alCodeLines.length) {
        loop = false;
      }
    } while (loop);
    const procedureDeclarationText = [
      attributes.join("\n"),
      procedureDeclarationArr.join("\n"),
    ].join("\n");
    const newAlControl = ALProcedure.fromString(procedureDeclarationText);
    newAlControl.parent = alControl.parent;
    newAlControl.startLineIndex = newAlControl.endLineIndex =
      alControl.startLineIndex;
    newAlControl.alCodeLines = alControl.alCodeLines;
    newAlControl.parent = alControl.parent;
    return newAlControl;
  } catch (error) {
    console.log(
      `Error while parsing procedure."${alCodeLines[procedureLineNo].code}"\nError: ${error}`
    );
    return alControl; // Fallback so that Xliff functions still work
  }
}

function parseXmlComments(
  control: ALControl,
  alCodeLines: ALCodeLine[],
  procedureLineNo: number
): void {
  // Parse XmlComment, if any
  let loop = true;
  let lineNo = procedureLineNo - 1;
  if (lineNo < 0) {
    return;
  }
  const xmlCommentArr: string[] = [];
  do {
    const line = alCodeLines[lineNo].code;
    if (line.trim() === "" || line.match(attributePattern)) {
      // Skip this line, but continue search for XmlComment
    } else if (line.trimStart().startsWith("///")) {
      xmlCommentArr.push(line);
    } else {
      loop = false;
    }
    lineNo--;
    if (lineNo < 0) {
      loop = false;
    }
  } while (loop);
  if (xmlCommentArr.length > 0) {
    control.xmlComment = ALXmlComment.fromString(xmlCommentArr.reverse());
  }
}

function matchALControl(
  parent: ALControl,
  lineIndex: number,
  codeLine: ALCodeLine
): ALControl | undefined {
  const alControlPattern = /^\s*\b(modify)\b\((.*)\)$|^\s*\b(dataitem)\b\((.*);.*\)|^\s*\b(column)\b\((.*);(.*)\)|^\s*\b(value)\b\(\d*;(.*)\)|^\s*\b(group)\b\((.*)\)|^\s*\b(field)\b\(\s*(.*)\s*;\s*(.*);\s*(.*)\s*\)|^\s*\b(field)\b\((.*);(.*)\)|^\s*\b(part)\b\((.*);(.*)\)|^\s*\b(action)\b\((.*)\)|^\s*\b(area)\b\((.*)\)|^\s*\b(trigger)\b (.*)\(.*\)|^\s*\b(procedure)\b ([^()]*)\(|^\s*\blocal (procedure)\b ([^()]*)\(|^\s*\binternal (procedure)\b ([^()]*)\(|^\s*\b(layout)\b$|^\s*\b(requestpage)\b$|^\s*\b(actions)\b$|^\s*\b(cuegroup)\b\((.*)\)|^\s*\b(repeater)\b\((.*)\)|^\s*\b(separator)\b\((.*)\)|^\s*\b(textattribute)\b\((.*)\)|^\s*\b(fieldattribute)\b\(([^;)]*);/i;
  let alControlResult = codeLine.code.match(alControlPattern);
  if (!alControlResult) {
    return;
  }
  let control;
  alControlResult = alControlResult.filter((elmt) => elmt !== undefined);
  switch (alControlResult[1].toLowerCase()) {
    case "modify":
      switch (parent.getObjectType()) {
        case ALObjectType.pageExtension:
          control = new ALControl(
            ALControlType.modifiedPageField,
            alControlResult[2]
          );
          break;
        case ALObjectType.tableExtension:
          control = new ALControl(
            ALControlType.modifiedTableField,
            alControlResult[2]
          );
          break;
        default:
          throw new Error(
            `modify not supported for Object type ${parent.getObjectType()}`
          );
      }
      control.xliffTokenType = XliffTokenType.change;
      break;
    case "textattribute":
      control = new ALControl(ALControlType.textAttribute, alControlResult[2]);
      control.xliffTokenType = XliffTokenType.xmlPortNode;
      break;
    case "fieldattribute":
      control = new ALControl(ALControlType.fieldAttribute, alControlResult[2]);
      control.xliffTokenType = XliffTokenType.xmlPortNode;
      break;
    case "cuegroup":
      control = new ALControl(ALControlType.cueGroup, alControlResult[2]);
      control.xliffTokenType = XliffTokenType.control;
      break;
    case "repeater":
      control = new ALControl(ALControlType.repeater, alControlResult[2]);
      control.xliffTokenType = XliffTokenType.control;
      break;
    case "requestpage":
      control = new ALControl(ALControlType.requestPage, "RequestOptionsPage");
      break;
    case "area":
      control = new ALControl(ALControlType.area, alControlResult[2]);
      if (parent.getGroupType() === ALControlType.actions) {
        control.xliffTokenType = XliffTokenType.action;
      } else {
        control.xliffTokenType = XliffTokenType.skip;
      }
      break;
    case "group":
      control = new ALControl(ALControlType.group, alControlResult[2]);
      if (parent.getGroupType() === ALControlType.actions) {
        control.xliffTokenType = XliffTokenType.action;
      } else {
        control.xliffTokenType = XliffTokenType.control;
      }
      break;
    case "part":
      control = new ALPagePart(
        ALControlType.part,
        alControlResult[2],
        alControlResult[3]
      );
      control.xliffTokenType = XliffTokenType.control;
      break;
    case "field":
      switch (parent.getObjectType()) {
        case ALObjectType.pageExtension:
        case ALObjectType.page:
        case ALObjectType.reportExtension:
        case ALObjectType.report:
          control = new ALPageField(
            ALControlType.pageField,
            alControlResult[2],
            alControlResult[3]
          );
          control.xliffTokenType = XliffTokenType.control;
          break;
        case ALObjectType.tableExtension:
        case ALObjectType.table:
          control = new ALTableField(
            ALControlType.tableField,
            (alControlResult[2] as unknown) as number,
            alControlResult[3],
            alControlResult[4]
          );
          control.xliffTokenType = XliffTokenType.field;
          break;
        default:
          throw new Error(
            `Field not supported for Object type ${parent.getObjectType()}`
          );
      }
      break;
    case "separator":
      control = new ALControl(ALControlType.separator, alControlResult[2]);
      control.xliffTokenType = XliffTokenType.action;
      break;
    case "action":
      control = new ALControl(ALControlType.action, alControlResult[2]);
      break;
    case "dataitem":
      switch (parent.getObjectType()) {
        case ALObjectType.reportExtension:
        case ALObjectType.report:
          control = new ALControl(ALControlType.dataItem, alControlResult[2]);
          control.xliffTokenType = XliffTokenType.reportDataItem;
          break;
        case ALObjectType.query:
          control = new ALControl(ALControlType.dataItem, alControlResult[2]);
          control.xliffTokenType = XliffTokenType.queryDataItem;
          break;
        default:
          throw new Error(
            `dataitem not supported for Object type ${parent.getObjectType()}`
          );
      }
      break;
    case "value":
      control = new ALControl(ALControlType.value, alControlResult[2]);
      control.xliffTokenType = XliffTokenType.enumValue;
      break;
    case "column":
      switch (parent.getObjectType()) {
        case ALObjectType.query:
          control = new ALControl(ALControlType.column, alControlResult[2]);
          control.xliffTokenType = XliffTokenType.queryColumn;
          break;
        case ALObjectType.reportExtension:
        case ALObjectType.report:
          control = new ALControl(ALControlType.column, alControlResult[2]);
          control.xliffTokenType = XliffTokenType.reportColumn;
          break;
        default:
          throw new Error(
            `Column not supported for Object type ${parent.getObjectType()}`
          );
      }
      break;
    case "trigger":
      control = new ALControl(ALControlType.trigger, alControlResult[2]);
      control.xliffTokenType = XliffTokenType.method;
      control.isALCode = true;
      break;
    case "procedure":
      control = new ALControl(ALControlType.procedure, alControlResult[2]);
      control.xliffTokenType = XliffTokenType.method;
      control.isALCode = true;
      break;
    case "layout":
      control = new ALControl(ALControlType.layout);
      control.xliffTokenType = XliffTokenType.skip;
      break;
    case "actions":
      control = new ALControl(ALControlType.actions);
      control.xliffTokenType = XliffTokenType.skip;
      break;
    default:
      throw new Error(
        `Control type ${alControlResult[1].toLowerCase()} is unhandled`
      );
  }
  control.startLineIndex = control.endLineIndex = lineIndex;
  control.alCodeLines = parent.alCodeLines;
  control.parent = parent;
  return control;
}

function getProperty(
  parent: ALControl,
  lineIndex: number,
  codeLine: ALCodeLine
): ALProperty | undefined {
  const propertyResult = codeLine.code.match(
    /^\s*(?<name>ObsoleteState|ObsoleteReason|ObsoleteTag|SourceTable|PageType|QueryType|ApplicationArea|Access|Subtype|DeleteAllowed|InsertAllowed|ModifyAllowed|Editable|APIGroup|APIPublisher|APIVersion|EntityName|EntitySetName)\s*=\s*(?<value>"[^"]*"|[\w]*|'[^']*');/i
  );

  if (propertyResult && propertyResult.groups) {
    const property = new ALProperty(
      parent,
      lineIndex,
      propertyResult.groups.name,
      propertyResult.groups.value
    );
    return property;
  }
  return;
}

export function matchIndentationDecreased(codeLine: ALCodeLine): boolean {
  const indentationDecrease = /(^\s*}|}\s*\/{2}(.*)$|^\s*\bend\b)/i;
  const decreaseResult = codeLine.code.trim().match(indentationDecrease);
  return null !== decreaseResult;
}

export function matchIndentationIncreased(codeLine: ALCodeLine): boolean {
  const indentationIncrease = /^\s*{$|{\s*\/{2}.*$|\bbegin\b\s*$|\bbegin\b\s*\/{2}.*$|^\s*\bcase\b\s.*\s\bof\b/i;
  const increaseResult = codeLine.code.trim().match(indentationIncrease);
  if (increaseResult) {
    if (increaseResult.index) {
      if (
        codeLine.code.trim().indexOf("//") !== -1 &&
        codeLine.code.trim().indexOf("//") < increaseResult.index
      ) {
        return false;
      }
    }
  }
  return null !== increaseResult;
}

function matchLabel(line: string): RegExpExecArray | null {
  const labelTokenPattern = /^\s*(?<name>\w*): Label (?<text>('(?<text1>[^']*'{2}[^']*)*')|'(?<text2>[^']*)')(?<maxLength3>,\s?MaxLength\s?=\s?(?<maxLengthValue3>\d*))?(?<locked>,\s?Locked\s?=\s?(?<lockedValue>true|false))?(?<maxLength2>,\s?MaxLength\s?=\s?(?<maxLengthValue2>\d*))?(?<comment>,\s?Comment\s?=\s?(?<commentText>('(?<commentText1>[^']*'{2}[^']*)*')|'(?<commentText2>[^']*)'))?(?<locked2>,\s?Locked\s?=\s?(?<lockedValue2>true|false))?(?<maxLength>,\s?MaxLength\s?=\s?(?<maxLengthValue>\d*))?(?<locked3>,\s?Locked\s?=\s?(?<lockedValue3>true|false))?/i;
  const labelTokenResult = labelTokenPattern.exec(line);
  return labelTokenResult;
}
export function getLabel(
  parent: ALControl,
  lineIndex: number,
  codeLine: ALCodeLine
): MultiLanguageObject | undefined {
  const matchResult = matchLabel(codeLine.code);
  const mlObject = getMlObjectFromMatch(
    parent,
    lineIndex,
    MultiLanguageType.label,
    matchResult
  );
  return mlObject;
}

function matchMlProperty(line: string): RegExpExecArray | null {
  const mlTokenPattern = /^\s*(?<commentedOut>\/\/)?\s*(?<name>OptionCaption|Caption|ToolTip|InstructionalText|PromotedActionCategories|RequestFilterHeading|AdditionalSearchTerms|EntityCaption|EntitySetCaption|ProfileDescription|AboutTitle|AboutText) = (?<text>('(?<text1>[^']*'{2}[^']*)*')|'(?<text2>[^']*)')(?<maxLength3>,\s?MaxLength\s?=\s?(?<maxLengthValue3>\d*))?(?<locked>,\s?Locked\s?=\s?(?<lockedValue>true|false))?(?<maxLength2>,\s?MaxLength\s?=\s?(?<maxLengthValue2>\d*))?(?<comment>,\s?Comment\s?=\s?(?<commentText>('(?<commentText1>[^']*'{2}[^']*)*')|'(?<commentText2>[^']*)'))?(?<locked2>,\s?Locked\s?=\s?(?<lockedValue2>true|false))?(?<maxLength>,\s?MaxLength\s?=\s?(?<maxLengthValue>\d*))?(?<locked3>,\s?Locked\s?=\s?(?<lockedValue3>true|false))?/i;
  const mlTokenResult = mlTokenPattern.exec(line);
  return mlTokenResult;
}
export function getMlProperty(
  parent: ALControl,
  lineIndex: number,
  codeLine: ALCodeLine
): MultiLanguageObject | undefined {
  const matchResult = matchMlProperty(codeLine.code);
  let mlType = MultiLanguageType.property;
  if (matchResult) {
    if (matchResult.groups) {
      const type = multiLanguageTypeMap.get(
        matchResult.groups.name.toLowerCase()
      );
      if (type) {
        mlType = type;
      }
    }
  }
  const mlObject = getMlObjectFromMatch(parent, lineIndex, mlType, matchResult);
  return mlObject;
}

function getMlObjectFromMatch(
  parent: ALControl,
  lineIndex: number,
  type: MultiLanguageType,
  matchResult: RegExpExecArray | null
): MultiLanguageObject | undefined {
  if (matchResult) {
    if (matchResult.groups) {
      const mlObject = new MultiLanguageObject(
        parent,
        type,
        matchResult.groups.name
      );
      if (matchResult.groups.commentedOut) {
        if (type !== MultiLanguageType.toolTip) {
          return;
        }
        mlObject.commentedOut = true;
      }
      mlObject.startLineIndex = mlObject.endLineIndex = lineIndex;
      mlObject.text = matchResult.groups.text.substr(
        1,
        matchResult.groups.text.length - 2
      ); // Remove leading and trailing '
      mlObject.text = Common.replaceAll(mlObject.text, `''`, `'`);
      if (matchResult.groups.locked) {
        if (matchResult.groups.lockedValue.toLowerCase() === "true") {
          mlObject.locked = true;
        }
      } else if (matchResult.groups.locked2) {
        if (matchResult.groups.lockedValue2.toLowerCase() === "true") {
          mlObject.locked = true;
        }
      } else if (matchResult.groups.locked3) {
        if (matchResult.groups.lockedValue3.toLowerCase() === "true") {
          mlObject.locked = true;
        }
      }
      if (matchResult.groups.commentText) {
        mlObject.comment = matchResult.groups.commentText.substr(
          1,
          matchResult.groups.commentText.length - 2
        ); // Remove leading and trailing '
      }
      mlObject.comment = Common.replaceAll(mlObject.comment, `''`, `'`);

      if (matchResult.groups.maxLength) {
        mlObject.maxLength = Number.parseInt(matchResult.groups.maxLengthValue);
      } else if (matchResult.groups.maxLength2) {
        mlObject.maxLength = Number.parseInt(
          matchResult.groups.maxLengthValue2
        );
      } else if (matchResult.groups.maxLength3) {
        mlObject.maxLength = Number.parseInt(
          matchResult.groups.maxLengthValue3
        );
      }
      return mlObject;
    }
  }
  return;
}
