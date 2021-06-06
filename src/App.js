import React from "react";
import styled from "styled-components";
import update from "immutability-helper";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";
import { useTable } from "react-table";

import makeData from "./makeData";

const Styles = styled.div`
  padding: 1rem;

  table {
    border-spacing: 0;
    border: 1px solid black;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      :last-child {
        border-right: 0;
      }
    }
  }
`;

const Table = ({ columns, data }) => {
  const [records, setRecords] = React.useState(data);
  const [columnList, setColumnList] = React.useState(columns);

  const getRowId = React.useCallback((row) => {
    return row.id;
  }, []);

  const getColumnId = React.useCallback((column) => {
    return column.id;
  }, []);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow
  } = useTable({
    data: records,
    columns: columnList,
    getRowId,
    getColumnId
  });

  const moveColumn = (dragIndex, hoverIndex) => {
    console.log(dragIndex);
    console.log(hoverIndex);
    const dragColumn = columnList[dragIndex];
    console.log(dragColumn);

    setColumnList(
      update(columnList, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, dragColumn]
        ]
      })
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              <th></th>
              {headerGroup.headers.map((column, index) => (
                <Column column={column} index={index} moveColumn={moveColumn} />
              ))}
            </tr>
            // <th {...column.getHeaderProps()}>{column.render("Header")}</th>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map(
            (row) =>
              prepareRow(row) || (
                <tr>
                  <td>move</td>
                  {row.cells.map((cell) => {
                    return (
                      <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                    );
                  })}
                </tr>
              )
          )}
        </tbody>
      </table>
    </DndProvider>
  );
};

const DND_COLUMN_TYPE = "column";

const Column = ({ column, index, moveColumn }) => {
  const dropRef = React.useRef(null);
  const dragRef = React.useRef(null);

  const [, drop] = useDrop({
    accept: DND_COLUMN_TYPE,
    hover(item, monitor) {
      if (!dropRef.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      // Determine rectangle on screen
      const hoverBoundingRect = dropRef.current.getBoundingClientRect();
      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.left - hoverBoundingRect.right) / 2;
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      // Get pixels to the top
      const hoverClientY = clientOffset.x - hoverBoundingRect.right;
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      moveColumn(dragIndex, hoverIndex);
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    }
  });

  const [{ isDragging }, drag, preview] = useDrag({
    item: { type: DND_COLUMN_TYPE, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const opacity = isDragging ? 0 : 1;

  preview(drop(dropRef));
  drag(dragRef);

  return (
    <th ref={dragRef} style={{ margin: "2rem" }} {...column.getHeaderProps()}>
      <th ref={dropRef} style={{ opacity, background: "red", margin: "2rem" }}>
        {column.render("Header")}
      </th>
    </th>
  );
};

const App = () => {
  const columns = React.useMemo(
    () => [
      {
        Header: "ID",
        accessor: "id"
      },

      {
        Header: "First Name",
        accessor: "firstName"
      },
      {
        Header: "Last Name",
        accessor: "lastName"
      },

      {
        Header: "Age",
        accessor: "age"
      },
      {
        Header: "Visits",
        accessor: "visits"
      },
      {
        Header: "Status",
        accessor: "status"
      },
      {
        Header: "Profile Progress",
        accessor: "progress"
      }
    ],
    []
  );

  const data = React.useMemo(() => makeData(20), []);

  return (
    <Styles>
      <Table columns={columns} data={data} />
    </Styles>
  );
};

export default App;
