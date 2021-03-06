import React from 'react';
import { connect } from 'react-redux';

// Styling
import '../code.css';


const mapStateToProps = store => ({
  tables: store.schema.tables,
});

const CodeDBPostgresSchemaContainer = (props) => {
  const enter = `
`;
  const tab = '  ';
  let createTablesCode = ``;
  const foreignKeys = {};
  let primaryKey = [];

  function parsePostgresSchema(table) {
    if (!table) return ``;

    createTablesCode += `${enter}CREATE TABLE "${table.type}" (${enter}`;

    // create code for each field
    for (const fieldId in table.fields) {
      createTablesCode += createSchemaField(table.fields[fieldId]);
      // so long as it's not the last field, add a comma
      const tableProps = Object.keys(table.fields);
      if (fieldId !== tableProps[tableProps.length - 1]) {
        createTablesCode += `,`;
      }
      createTablesCode += `${enter}`; 
    }

    // if table has a primary key
    if (primaryKey.length > 0) {
      createTablesCode += `${tab}${tab}CONSTRAINT ${table.type}_pk PRIMARY KEY (`;
      primaryKey.forEach((key, i) => {
        if (i === primaryKey.length - 1) {
          createTablesCode += `"${key}")${enter}`;
        } else {
          createTablesCode += `"${key}", `;
        }
      });
      createTablesCode += `${enter}) WITH (${enter} OIDS=FALSE${enter});${enter}`;
    } else {
      createTablesCode += `${enter});`;
    }
    // reset primaryKey to empty so primary keys don't slip into the next table
    primaryKey = [];
    createTablesCode += `${enter}${enter}`;
  }

  function createSchemaField(field) {
    let fieldCode = ``;
    fieldCode += `${tab}${tab}"${field.name}"${tab}${checkDataType(field.type, field.autoIncrement)}`;
    fieldCode += checkRequired(field.required);
    fieldCode += checkUnique(field.unique);
    fieldCode += checkDefault(field.defaultValue);

    if (field.primaryKey) {
      primaryKey.push(field.name);
    }

    if (field.relationSelected) {
      const relationData = {
        "relatedTable": field.relation.tableIndex,
        "relatedField": field.relation.fieldIndex,
        "fieldMakingRelation": field.fieldNum
      };
      if (foreignKeys[field.tableNum]) {
        foreignKeys[field.tableNum].push(relationData);
      } else {
        foreignKeys[field.tableNum] = [relationData];
      }
    }
    return fieldCode;
  }

  function checkDataType(dataType, autoIncrement) {
    if (autoIncrement) return "serial";
    switch(dataType){
      case "String":
        return "varchar";
      case "Number":
        return "integer";
      case "Boolean":
        return "boolean";
      case "ID":
        return "serial";
    }
  }

  function checkUnique(fieldUnique) {
    if (fieldUnique) return `${tab}UNIQUE`;
    else return '';
  }

  function checkRequired(fieldRequired) {
    if (fieldRequired) return `${tab}NOT NULL`;
    else return '';
  }

  function checkDefault(fieldDefault) {
    if (fieldDefault.length > 0) return `${tab}DEFAULT "${fieldDefault}"`;
    else return '';
  }

  // loop through tables and create build script for each table
  for (const tableId in props.tables) {
    parsePostgresSchema(props.tables[tableId]);
  }

  // if any tables have relations, aka foreign keys
  for (const tableId in foreignKeys) {
    // console.log('what are foreignKeys', foreignKeys);
    // loop through the table's fields to find the particular relation
    foreignKeys[tableId].forEach((relationInfo, relationCount) => {
      // name of table making relation
      const tableMakingRelation = props.tables[tableId].type;
      // get name of field making relation
      const fieldId = relationInfo.fieldMakingRelation;
      const fieldMakingRelation = props.tables[tableId].fields[fieldId].name;
      // get name of table being referenced
      const relatedTableId = relationInfo.relatedTable;
      const relatedTable = props.tables[relatedTableId].type;
      // get name of field being referenced
      const relatedFieldId = relationInfo.relatedField;
      const relatedField = props.tables[relatedTableId].fields[relatedFieldId].name;
      createTablesCode += `ALTER TABLE "${tableMakingRelation}" ADD CONSTRAINT "${tableMakingRelation}_fk${relationCount}" FOREIGN KEY ("${fieldMakingRelation}") REFERENCES "${relatedTable}"("${relatedField}");${enter}`;
    });
  }


  return (
    <div id="code-container-database">
      <h4 className='codeHeader'>PostgreSQL Create Scripts</h4>
      <hr/>
      <pre>
        {createTablesCode}
      </pre>
      <pre id='column-filler-for-scroll'></pre>
    </div>
  );
};

export default connect(mapStateToProps, null)(CodeDBPostgresSchemaContainer);
