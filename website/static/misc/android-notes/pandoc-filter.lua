-- function Div(el)
--   -- el.classes is a list of classes on this Div
--   for _, c in ipairs(el.classes) do
--     if c == "only-web" then
--       return {}  -- delete the div and its content
--     end
--   end
-- end

-- function Image(el)
--   local src = el.src
--   local options = {}
  
--   -- Collect supported attributes
--   if el.attributes.width then
--     table.insert(options, "width=" .. el.attributes.width)
--   end
  
--   if el.attributes.height then
--     table.insert(options, "height=" .. el.attributes.height)
--   end
  
--   if el.attributes.scale then
--     table.insert(options, "scale=" .. el.attributes.scale)
--   end
  
--   -- Build the command
--   local latex = "\\includegraphics"
  
--   if #options > 0 then
--     latex = latex .. "[" .. table.concat(options, ",") .. "]"
--   end
  
--   latex = latex .. "{" .. src .. "}"
  
--   return pandoc.RawInline('latex', latex)
-- end