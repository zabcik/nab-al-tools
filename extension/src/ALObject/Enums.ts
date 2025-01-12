// BC ObjectType: ", Table,, Report,, Codeunit, XMLport, MenuSuite, Page, Query,,,,, PageExtension, TableExtension"
export enum ALObjectType {
  none = "None",
  table = "Table",
  report = "Report",
  codeunit = "Codeunit",
  xmlPort = "XmlPort",
  page = "Page",
  query = "Query",
  pageExtension = "PageExtension",
  tableExtension = "TableExtension",
  reportExtension = "ReportExtension",
  pageCustomization = "PageCustomization",
  profile = "Profile",
  requestPage = "RequestPage",
  enum = "Enum",
  enumExtension = "EnumExtension",
  interface = "Interface",
}
export enum ALPropertyType {
  unknown,
  sourceTable,
  pageType,
  queryType,
  obsoleteState,
  obsoleteReason,
  obsoleteTag,
  access,
  applicationArea,
  subtype,
  deleteAllowed,
  insertAllowed,
  modifyAllowed,
  editable,
  apiGroup,
  apiPublisher,
  apiVersion,
  entityName,
  entitySetName,
}
export enum ALCodeunitSubtype {
  normal,
  test,
  testRunner,
  install,
  upgrade,
  unknown,
}

export enum ALControlType {
  none = "None",
  object = "Object",
  pageField = "PageField", // Used for tooltip sorting
  group = "Group", // Used for tooltip sorting
  action = "Action", // Used for tooltip sorting
  part = "Part", // Used for tooltip sorting
  dataItem = "DataItem",
  column = "Column",
  value = "Value",
  tableField = "TableField",
  area = "Area",
  trigger = "Trigger",
  procedure = "Procedure",
  layout = "Layout",
  requestPage = "RequestPage",
  actions = "Actions",
  cueGroup = "CueGroup",
  repeater = "Repeater",
  separator = "Separator",
  textAttribute = "TextAttribute",
  fieldAttribute = "FieldAttribute",
  modifiedPageField = "ModifiedPageField",
  modifiedTableField = "ModifiedTableField",
}

export enum MultiLanguageType {
  label = "Label",
  namedType = "NamedType",
  property = "Property",
  optionCaption = "OptionCaption",
  caption = "Caption",
  toolTip = "ToolTip",
  instructionalText = "InstructionalText",
  promotedActionCategories = "PromotedActionCategories",
  requestFilterHeading = "RequestFilterHeading",
  additionalSearchTerms = "AdditionalSearchTerms",
  entityCaption = "EntityCaption",
  entitySetCaption = "EntitySetCaption",
  profileDescription = "ProfileDescription",
  aboutTitle = "AboutTitle",
  aboutText = "AboutText",
}

export enum XliffTokenType {
  skip = "Skip",
  inheritFromObjectType = "InheritFromObjectType",
  inheritFromControl = "InheritFromControl",
  xmlPortNode = "XmlPortNode",
  control = "Control",
  reportDataItem = "ReportDataItem",
  reportColumn = "ReportColumn",
  queryDataItem = "QueryDataItem",
  queryColumn = "QueryColumn",
  enumValue = "EnumValue",
  method = "Method",
  action = "Action",
  field = "Field",
  change = "Change",
}
export enum ALAccessModifier {
  public,
  internal,
  local,
  protected,
}

export enum DocsType {
  public,
  api,
  ws,
}
