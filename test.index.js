type todoType = {
    description: string,
    keyword: string,
    lineNumber: int,
  }
  type rec itemType = {
    label: string,
    uri: string,
    children: array<itemType>,
    todos?: array<todoType>,
  }
  
  type listType = {
    appid: string,
    id: string,
    metatype: string,
    name: string,
    nature: string,
    path: string,
    root: bool,
    children: array<itemType>,
  }

    let list: array<listType> = [/** TODO... */]

let rec create_ul = (list, elUl) => {
    list->for_each(item => {
      
      switch item.children {
      | Some(children) => {
       
          let ul = document->create_element("ul")
          ul->class_list->add_class("list")
          children->create_ul(ul)
          li->append_child(ul)
        }
  
      | _ => ()
      }
      elUl->append_child(li)
    })
  }